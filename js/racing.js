import * as THREE from 'three';

// Collision half-extents matching the car model geometry
const CAR_HALF_WIDTH = 1.1;   // ~body 2.0 + wheel overhang
const CAR_HALF_LENGTH = 2.1;  // ~body 4.0 / 2 + bumper clearance

// Racing state for a single car (player or AI)
export class CarRacer {
    static debugColliders = false;

    constructor(carModel, curve, frames, roadWidth, startOffset, isPlayer = false) {
        this.model = carModel;
        this.curve = curve;
        this.frames = frames;
        this.roadWidth = roadWidth;
        this.isPlayer = isPlayer;
        this.colliding = false;
        this._lastExplodeTime = 0; // timestamp (ms) of last explosion — debounce per car
        this.destroyed = false;    // permanently destroyed by a hard hit
        this.curveLength = curve.getLength(); // cache for collision response

        // Set rotation order for correct yaw-pitch-roll with hills
        this.model.rotation.order = 'YXZ';

        // Create debug collider wireframe (hidden by default)
        this._createDebugCollider();

        // Progress along the track (0 to 1, wraps around)
        this.trackProgress = startOffset;
        this.lateralOffset = 0; // -1 to 1, position across the road

        // Speed and steering — normalize by track length so world-space speed is consistent
        // Reference: original oval is ~565 world units
        const speedScale = 565 / this.curveLength;
        this.speed = 0;
        this.maxSpeed = (isPlayer ? 0.0015 : 0.001275) * speedScale;
        this.acceleration = (isPlayer ? 0.00003 : 0.000025) * speedScale;
        this.steerSpeed = isPlayer ? 0.035 : 0.03;
        this.steering = 0;

        // Lap tracking
        this.lap = 0;
        this.lastProgress = startOffset;
        this.finished = false;
        this.finishTime = 0;
        this.totalLaps = 3;

        // Jump / ramp physics
        this.jumpVelocity = 0;
        this.jumpHeight = 0;
        this.isAirborne = false;

        this.updatePosition();
    }

    updatePosition() {
        const t = ((this.trackProgress % 1) + 1) % 1;
        const point = this.curve.getPointAt(t);

        // Interpolate between frame indices for smooth transitions
        const rawIdx = t * 200;
        const idx0 = Math.floor(rawIdx) % 201;
        const idx1 = (idx0 + 1) % 201;
        const frac = rawIdx - Math.floor(rawIdx);

        // Lerp right vector and tangent between adjacent frames
        const right = this.frames.binormals[idx0].clone().lerp(this.frames.binormals[idx1], frac);
        const tangent = this.frames.tangents[idx0].clone().lerp(this.frames.tangents[idx1], frac);

        // Interpolate bank angle
        const bank0 = this.frames.bankAngles ? this.frames.bankAngles[idx0] : 0;
        const bank1 = this.frames.bankAngles ? this.frames.bankAngles[idx1] : 0;
        const bankAngle = bank0 + (bank1 - bank0) * frac;

        // Apply lateral offset (right vector points to the right of travel direction)
        const maxLateral = this.roadWidth / 2 - 1.5;
        const lateralPos = this.lateralOffset * maxLateral;
        const offset = right.clone().multiplyScalar(lateralPos);

        // Banking: tilt car and adjust Y position based on road bank angle
        const maxLateralWorld = this.roadWidth / 2 - 1.5;
        const lateralWorld = this.lateralOffset * maxLateralWorld;
        // bankLift raises the road center at banked sections so the low side stays above ground
        const bankLift = Math.abs(Math.sin(bankAngle)) * (this.roadWidth / 2);
        const bankY = Math.sin(bankAngle) * lateralWorld;

        this.model.position.set(
            point.x + offset.x,
            point.y + 0.2 + bankLift + bankY + this.jumpHeight,
            point.z + offset.z
        );

        // Face the direction of travel, yaw nose into steering direction
        const angle = Math.atan2(tangent.x, tangent.z);
        this.model.rotation.y = angle - this.steering * 0.15;

        // Pitch: airborne cars tilt based on jump velocity, grounded cars follow terrain
        if (this.isAirborne) {
            this.model.rotation.x = -Math.atan2(this.jumpVelocity * 0.04, 1);
            this.model.rotation.z = 0; // no banking in air
        } else {
            if (this.frames.tangents3D) {
                const t3d0 = this.frames.tangents3D[idx0];
                const t3d1 = this.frames.tangents3D[idx1];
                const ty = t3d0.y + (t3d1.y - t3d0.y) * frac;
                const txz0 = Math.sqrt(t3d0.x * t3d0.x + t3d0.z * t3d0.z);
                const txz1 = Math.sqrt(t3d1.x * t3d1.x + t3d1.z * t3d1.z);
                const txz = txz0 + (txz1 - txz0) * frac;
                this.model.rotation.x = -Math.atan2(ty, txz);
            }

            // Roll car to match road banking
            this.model.rotation.z = -bankAngle;
        }

        // Spin wheels (rolling)
        const wheels = this.model.userData.wheels;
        if (wheels) {
            for (const wheel of wheels) {
                wheel.rotation.x += this.speed * 500;
            }
        }

        // Steer front wheels (yaw the steering groups)
        const frontGroups = this.model.userData.frontWheelGroups;
        if (frontGroups) {
            const steerAngle = -this.steering * 0.4; // visual wheel turn amount
            for (const grp of frontGroups) {
                grp.rotation.y = steerAngle;
            }
        }

        // Pulse player ring
        if (this.model.userData.playerRing) {
            this.model.userData.playerRing.material.opacity = 0.2 + Math.sin(Date.now() * 0.005) * 0.2;
        }
    }

    update(dt, steerInput, throttle = 1.0) {
        // Normalize to 60fps baseline so speed is consistent across refresh rates
        const step = dt * 60;

        if (this.finished) {
            this.speed *= Math.pow(0.98, step);
            this.trackProgress += this.speed * step;
            // Keep jump physics running for finished cars mid-air
            if (this.isAirborne) {
                this.jumpHeight += this.jumpVelocity * dt;
                this.jumpVelocity -= 25 * dt;
                if (this.jumpHeight <= 0) {
                    this.jumpHeight = 0;
                    this.jumpVelocity = 0;
                    this.isAirborne = false;
                }
            }
            this.updatePosition();
            return;
        }

        // Throttle-based acceleration
        if (throttle > 0) {
            const targetSpeed = this.maxSpeed * throttle;
            this.speed += (targetSpeed - this.speed) * 0.05 * step;
            this.speed = Math.min(this.speed, this.maxSpeed);
        } else {
            // Coast / decelerate when not pressing throttle
            this.speed *= Math.pow(0.97, step);
            if (this.speed < 0.00001) this.speed = 0;
        }

        // Steering: positive = right, negative = left
        this.steering = steerInput;
        this.lateralOffset += this.steering * this.steerSpeed * (this.speed / this.maxSpeed) * step;
        this.lateralOffset = Math.max(-0.95, Math.min(0.95, this.lateralOffset));

        // Move along track
        this.trackProgress += this.speed * step;

        // Jump physics (gravity + landing)
        if (this.isAirborne) {
            this.jumpHeight += this.jumpVelocity * dt;
            this.jumpVelocity -= 25 * dt; // gravity
            if (this.jumpHeight <= 0) {
                this.jumpHeight = 0;
                this.jumpVelocity = 0;
                this.isAirborne = false;
            }
        }

        // Ramp detection — check if we crossed a ramp trigger point (at ramp base)
        const currentProgress = ((this.trackProgress % 1) + 1) % 1;
        if (this.frames.ramps && !this.isAirborne) {
            for (const ramp of this.frames.ramps) {
                const trigger = ramp.triggerT != null ? ramp.triggerT : ramp.t;
                const prev = this.lastProgress;
                const curr = currentProgress;
                let crossed = false;
                if (prev <= curr) {
                    crossed = prev < trigger && curr >= trigger;
                } else {
                    // Wrapped around (crossing lap boundary)
                    crossed = prev < trigger || curr >= trigger;
                }
                // Must be fast enough AND on the correct side of the road
                const onRampSide = !ramp.side || (this.lateralOffset * ramp.side > -0.2);
                if (crossed && this.speed > this.maxSpeed * 0.3 && onRampSide) {
                    const speedFrac = this.speed / this.maxSpeed;
                    this.jumpVelocity = 6 + speedFrac * 8;
                    this.isAirborne = true;
                    this.jumpHeight = 0.01;
                }
            }
        }

        // Lap detection
        if (this.lastProgress > 0.9 && currentProgress < 0.1) {
            this.lap++;
        }
        this.lastProgress = currentProgress;

        this.updatePosition();
    }

    getEffectiveDistance() {
        return this.lap + (this.trackProgress % 1);
    }

    // Create a wireframe box showing the collision bounds (child of car model)
    _createDebugCollider() {
        const geo = new THREE.BoxGeometry(CAR_HALF_WIDTH * 2, 0.8, CAR_HALF_LENGTH * 2);
        const edges = new THREE.EdgesGeometry(geo);
        const mat = new THREE.LineBasicMaterial({ color: 0x00ff00 });
        this._debugWire = new THREE.LineSegments(edges, mat);
        this._debugWire.position.y = 0.6; // center on car body
        this._debugWire.visible = CarRacer.debugColliders;
        this.model.add(this._debugWire);
    }

    _setDebugColor(hex) {
        if (this._debugWire) this._debugWire.material.color.setHex(hex);
    }

    static toggleDebug(racers) {
        CarRacer.debugColliders = !CarRacer.debugColliders;
        for (const r of racers) {
            if (r._debugWire) r._debugWire.visible = CarRacer.debugColliders;
        }
    }

    // OBB vs OBB collision test using the Separating Axis Theorem (2D in XZ plane)
    // Returns { overlap, nx, nz } if colliding, or null if separated.
    static _obbTest(a, b) {
        const angleA = a.model.rotation.y;
        const angleB = b.model.rotation.y;

        // Each car's local axes in world XZ space
        // Forward (local +Z) and Right (local +X)
        const fwdA = { x: Math.sin(angleA), z: Math.cos(angleA) };
        const rgtA = { x: Math.cos(angleA), z: -Math.sin(angleA) };
        const fwdB = { x: Math.sin(angleB), z: Math.cos(angleB) };
        const rgtB = { x: Math.cos(angleB), z: -Math.sin(angleB) };

        // Half-extents: forward = halfLength, right = halfWidth
        const hL = CAR_HALF_LENGTH;
        const hW = CAR_HALF_WIDTH;

        const dx = b.model.position.x - a.model.position.x;
        const dz = b.model.position.z - a.model.position.z;

        // Test 4 separating axes (2 per box)
        const axes = [fwdA, rgtA, fwdB, rgtB];
        let minOverlap = Infinity;
        let minAxis = null;

        for (const ax of axes) {
            // Project center-to-center distance onto this axis
            const dist = Math.abs(dx * ax.x + dz * ax.z);

            // Project both boxes' half-extents onto this axis
            const projA = hL * Math.abs(fwdA.x * ax.x + fwdA.z * ax.z) +
                          hW * Math.abs(rgtA.x * ax.x + rgtA.z * ax.z);
            const projB = hL * Math.abs(fwdB.x * ax.x + fwdB.z * ax.z) +
                          hW * Math.abs(rgtB.x * ax.x + rgtB.z * ax.z);

            const overlap = projA + projB - dist;
            if (overlap <= 0) return null; // separated on this axis

            if (overlap < minOverlap) {
                minOverlap = overlap;
                minAxis = ax;
            }
        }

        // Collision detected — ensure push direction points from A to B
        const sign = (dx * minAxis.x + dz * minAxis.z) >= 0 ? 1 : -1;
        return {
            overlap: minOverlap,
            nx: minAxis.x * sign,
            nz: minAxis.z * sign,
        };
    }

    // Resolve collisions between all racers using OBB physics.
    // Returns { playerHit, explodedRacers } where explodedRacers are AI cars
    // newly hit by the player (4s cooldown per car).
    static resolveCollisions(racers) {
        // Reset collision flag for debug coloring
        for (const r of racers) r.colliding = false;
        let playerHit = false;
        const explodedRacers = [];
        const now = Date.now();

        for (let i = 0; i < racers.length; i++) {
            for (let j = i + 1; j < racers.length; j++) {
                const a = racers[i];
                const b = racers[j];

                // Skip invisible (currently exploded), destroyed, or airborne cars
                if (!a.model.visible || !b.model.visible) continue;
                if (a.destroyed || b.destroyed) continue;
                if (a.isAirborne || b.isAirborne) continue;

                // Quick circle pre-check (skip if too far for any possible overlap)
                const dx = b.model.position.x - a.model.position.x;
                const dz = b.model.position.z - a.model.position.z;
                const maxReach = CAR_HALF_LENGTH * 2 + 1;
                if (dx * dx + dz * dz > maxReach * maxReach) continue;

                const hit = CarRacer._obbTest(a, b);
                if (!hit) continue;

                a.colliding = true;
                b.colliding = true;
                if (a.isPlayer || b.isPlayer) {
                    playerHit = true;
                    // Track which AI car was newly hit for the explosion effect
                    const aiRacer = a.isPlayer ? b : a;
                    if (!aiRacer.isPlayer && now - aiRacer._lastExplodeTime > 4000) {
                        aiRacer._lastExplodeTime = now;
                        explodedRacers.push(aiRacer);
                    }
                }

                const { overlap, nx, nz } = hit;

                // Push weights - player is heavier (moves less)
                const weightA = a.isPlayer ? 0.3 : 0.5;
                const weightB = b.isPlayer ? 0.3 : 0.5;

                // Get track frame data for both cars
                const t_a = ((a.trackProgress % 1) + 1) % 1;
                const t_b = ((b.trackProgress % 1) + 1) % 1;
                const idxA = Math.floor(t_a * 200) % 201;
                const idxB = Math.floor(t_b * 200) % 201;
                const rightA = a.frames.binormals[idxA];
                const rightB = b.frames.binormals[idxB];
                const tangentA = a.frames.tangents[idxA];
                const tangentB = b.frames.tangents[idxB];

                // Decompose push into lateral (across track) and longitudinal (along track)
                // Push direction (nx, nz) points from A → B
                const latCompA = nx * rightA.x + nz * rightA.z;   // how much push is sideways for A
                const lonCompA = nx * tangentA.x + nz * tangentA.z; // how much push is along track for A
                const latCompB = nx * rightB.x + nz * rightB.z;
                const lonCompB = nx * tangentB.x + nz * tangentB.z;

                // Apply lateral separation (push A left, push B right)
                const maxLateralA = a.roadWidth / 2 - 1.5;
                const maxLateralB = b.roadWidth / 2 - 1.5;

                a.lateralOffset -= (latCompA * overlap / maxLateralA) * weightA;
                b.lateralOffset += (latCompB * overlap / maxLateralB) * weightB;

                a.lateralOffset = Math.max(-0.95, Math.min(0.95, a.lateralOffset));
                b.lateralOffset = Math.max(-0.95, Math.min(0.95, b.lateralOffset));

                // Apply longitudinal separation (push apart along track)
                // Convert world distance to trackProgress delta
                const invLenA = 1 / a.curveLength;
                const invLenB = 1 / b.curveLength;

                a.trackProgress -= lonCompA * overlap * weightA * invLenA;
                b.trackProgress += lonCompB * overlap * weightB * invLenB;

                // Gentle speed exchange on contact (NOT the brutal 0.85 per frame!)
                const aAhead = a.getEffectiveDistance() > b.getEffectiveDistance();
                const frontCar = aAhead ? a : b;
                const rearCar = aAhead ? b : a;

                rearCar.speed *= 0.97;   // gentle tap on the brakes
                frontCar.speed = Math.min(frontCar.speed * 1.01, frontCar.maxSpeed);

                // Re-update positions after collision resolution
                a.updatePosition();
                b.updatePosition();
            }
        }

        // Update debug collider colors
        if (CarRacer.debugColliders) {
            for (const r of racers) {
                r._setDebugColor(r.colliding ? 0xff0000 : 0x00ff00);
            }
        }

        return { playerHit, explodedRacers };
    }
}

// Controls handler with keyboard, touch, and gamepad support
export class Controls {
    constructor() {
        this.left = false;
        this.right = false;
        this.throttleKey = false;
        this.lookBack = false;
        this.gamepadIndex = null;
        this.gamepadSteer = 0;
        this.gamepadThrottle = 0;
        this.startPressed = false;
        this._lastStartState = false;

        this._onKeyDown = (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.left = true;
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.right = true;
            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') this.throttleKey = true;
            if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') this.lookBack = true;
        };
        this._onKeyUp = (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.left = false;
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.right = false;
            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') this.throttleKey = false;
            if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') this.lookBack = false;
        };

        window.addEventListener('keydown', this._onKeyDown);
        window.addEventListener('keyup', this._onKeyUp);

        // Gamepad support
        this._onGamepadConnected = (e) => {
            this.gamepadIndex = e.gamepad.index;
        };
        this._onGamepadDisconnected = (e) => {
            if (this.gamepadIndex === e.gamepad.index) {
                this.gamepadIndex = null;
                this.gamepadSteer = 0;
            }
        };
        window.addEventListener('gamepadconnected', this._onGamepadConnected);
        window.addEventListener('gamepaddisconnected', this._onGamepadDisconnected);

        // Check for already-connected gamepads
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        for (const gp of gamepads) {
            if (gp) { this.gamepadIndex = gp.index; break; }
        }

        this._setupTouch();
    }

    _setupTouch() {
        const leftBtn = document.getElementById('steer-left');
        const rightBtn = document.getElementById('steer-right');

        if (leftBtn) {
            leftBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.left = true; });
            leftBtn.addEventListener('touchend', () => { this.left = false; });
            leftBtn.addEventListener('mousedown', () => { this.left = true; });
            leftBtn.addEventListener('mouseup', () => { this.left = false; });
        }
        if (rightBtn) {
            rightBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.right = true; });
            rightBtn.addEventListener('touchend', () => { this.right = false; });
            rightBtn.addEventListener('mousedown', () => { this.right = true; });
            rightBtn.addEventListener('mouseup', () => { this.right = false; });
        }
    }

    _pollGamepad() {
        if (this.gamepadIndex === null) return;
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        const gp = gamepads[this.gamepadIndex];
        if (!gp) return;

        // Left stick X axis (axis 0)
        const deadzone = 0.15;
        const stickX = gp.axes[0] || 0;
        this.gamepadSteer = Math.abs(stickX) > deadzone ? stickX : 0;

        // D-pad: buttons 14 (left) and 15 (right) on standard gamepad mapping
        if (gp.buttons[14] && gp.buttons[14].pressed) this.gamepadSteer = -1;
        if (gp.buttons[15] && gp.buttons[15].pressed) this.gamepadSteer = 1;

        // Right trigger (RT) for analog throttle (button 7, value 0.0–1.0)
        this.gamepadThrottle = gp.buttons[7] ? gp.buttons[7].value : 0;

        // Y button (button 3) for look-back camera
        if (gp.buttons[3]) this.lookBack = gp.buttons[3].pressed;

        // Start button (button 9) with edge detection
        const startBtn = gp.buttons[9] ? gp.buttons[9].pressed : false;
        this.startPressed = startBtn && !this._lastStartState;
        this._lastStartState = startBtn;
    }

    getSteerInput() {
        this._pollGamepad();

        // Gamepad takes priority if active
        if (Math.abs(this.gamepadSteer) > 0.1) {
            return Math.max(-1, Math.min(1, this.gamepadSteer));
        }

        // Keyboard / touch
        if (this.left && !this.right) return -1;
        if (this.right && !this.left) return 1;
        return 0;
    }

    getThrottleInput() {
        // Gamepad RT analog trigger takes priority (0.0–1.0)
        if (this.gamepadIndex !== null && this.gamepadThrottle > 0.05) {
            return Math.min(1, this.gamepadThrottle);
        }
        // Keyboard / touch: full throttle when key held
        return this.throttleKey ? 1.0 : 0.0;
    }

    destroy() {
        window.removeEventListener('keydown', this._onKeyDown);
        window.removeEventListener('keyup', this._onKeyUp);
        window.removeEventListener('gamepadconnected', this._onGamepadConnected);
        window.removeEventListener('gamepaddisconnected', this._onGamepadDisconnected);
    }
}

// Camera controller - follows the player car
export class RaceCamera {
    constructor(camera) {
        this.camera = camera;
        this.targetPosition = new THREE.Vector3();
        this.targetLookAt = new THREE.Vector3();
        this.smoothFactor = 0.05;
    }

    update(playerRacer, lookBack = false) {
        if (!playerRacer) return;

        const carPos = playerRacer.model.position.clone();
        const carRotation = playerRacer.model.rotation.y;

        // Flip camera direction when looking back
        const dir = lookBack ? 1 : -1;
        const cameraOffset = new THREE.Vector3(
            dir * Math.sin(carRotation) * 12,
            7,
            dir * Math.cos(carRotation) * 12
        );

        this.targetPosition.copy(carPos).add(cameraOffset);
        this.targetLookAt.copy(carPos).add(new THREE.Vector3(0, 1, 0));

        // Split lerp: faster Y tracking to prevent camera clipping through hills
        this.camera.position.x += (this.targetPosition.x - this.camera.position.x) * this.smoothFactor;
        this.camera.position.z += (this.targetPosition.z - this.camera.position.z) * this.smoothFactor;
        this.camera.position.y += (this.targetPosition.y - this.camera.position.y) * 0.12;
        this.camera.lookAt(this.targetLookAt);
    }
}
