import * as THREE from 'three';

// Racing state for a single car (player or AI)
export class CarRacer {
    constructor(carModel, curve, frames, roadWidth, startOffset, isPlayer = false) {
        this.model = carModel;
        this.curve = curve;
        this.frames = frames;
        this.roadWidth = roadWidth;
        this.isPlayer = isPlayer;

        // Progress along the track (0 to 1, wraps around)
        this.trackProgress = startOffset;
        this.lateralOffset = 0; // -1 to 1, position across the road

        // Speed and steering
        this.speed = 0;
        this.maxSpeed = isPlayer ? 0.0012 : 0.0009;
        this.acceleration = isPlayer ? 0.00003 : 0.00002;
        this.steerSpeed = isPlayer ? 0.035 : 0.02;
        this.steering = 0;

        // Lap tracking
        this.lap = 0;
        this.lastProgress = startOffset;
        this.finished = false;
        this.finishTime = 0;
        this.totalLaps = 3;

        this.updatePosition();
    }

    updatePosition() {
        const t = ((this.trackProgress % 1) + 1) % 1;
        const point = this.curve.getPoint(t);

        const idx = Math.floor(t * 200) % 201;
        const right = this.frames.binormals[idx];
        const tangent = this.frames.tangents[idx];

        // Apply lateral offset (right vector points to the right of travel direction)
        const maxLateral = this.roadWidth / 2 - 1.5;
        const lateralPos = this.lateralOffset * maxLateral;
        const offset = right.clone().multiplyScalar(lateralPos);

        this.model.position.set(
            point.x + offset.x,
            0.2,
            point.z + offset.z
        );

        // Face the direction of travel
        const angle = Math.atan2(tangent.x, tangent.z);
        this.model.rotation.y = angle + this.steering * 0.15;

        // Spin wheels
        const wheels = this.model.userData.wheels;
        if (wheels) {
            for (const wheel of wheels) {
                wheel.rotation.x += this.speed * 500;
            }
        }

        // Pulse player ring
        if (this.model.userData.playerRing) {
            this.model.userData.playerRing.material.opacity = 0.2 + Math.sin(Date.now() * 0.005) * 0.2;
        }
    }

    update(dt, steerInput) {
        if (this.finished) {
            this.speed *= 0.98;
            this.trackProgress += this.speed;
            this.updatePosition();
            return;
        }

        // Auto-accelerate
        this.speed = Math.min(this.speed + this.acceleration, this.maxSpeed);

        // Steering: positive = right, negative = left
        this.steering = steerInput;
        this.lateralOffset += this.steering * this.steerSpeed * (this.speed / this.maxSpeed);
        this.lateralOffset = Math.max(-0.95, Math.min(0.95, this.lateralOffset));

        // Move along track
        this.trackProgress += this.speed;

        // Lap detection
        const currentProgress = this.trackProgress % 1;
        if (this.lastProgress > 0.9 && currentProgress < 0.1) {
            this.lap++;
        }
        this.lastProgress = currentProgress;

        this.updatePosition();
    }

    getEffectiveDistance() {
        return this.lap + (this.trackProgress % 1);
    }
}

// Controls handler with keyboard, touch, and gamepad support
export class Controls {
    constructor() {
        this.left = false;
        this.right = false;
        this.gamepadIndex = null;
        this.gamepadSteer = 0;

        this._onKeyDown = (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.left = true;
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.right = true;
        };
        this._onKeyUp = (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.left = false;
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.right = false;
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

    update(playerRacer) {
        if (!playerRacer) return;

        const carPos = playerRacer.model.position.clone();
        const carRotation = playerRacer.model.rotation.y;

        const cameraOffset = new THREE.Vector3(
            -Math.sin(carRotation) * 12,
            7,
            -Math.cos(carRotation) * 12
        );

        this.targetPosition.copy(carPos).add(cameraOffset);
        this.targetLookAt.copy(carPos).add(new THREE.Vector3(0, 1, 0));

        this.camera.position.lerp(this.targetPosition, this.smoothFactor);
        this.camera.lookAt(this.targetLookAt);
    }
}
