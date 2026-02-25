import * as THREE from 'three';

const GRAVITY = -18; // world units per second²

// Debris piece shapes: [width, height, depth]
const SHAPES = [
    [1.8, 0.12, 1.1],   // hood panel
    [1.6, 0.12, 1.0],   // trunk panel
    [0.70, 0.90, 0.12], // side door
    [0.70, 0.90, 0.12], // other door
    [0.55, 0.40, 0.50], // front bumper chunk
    [0.55, 0.40, 0.50], // rear bumper chunk
    [0.55, 0.55, 0.55], // wheel (dark)
    [0.55, 0.55, 0.55], // wheel (dark)
    [0.40, 0.30, 0.40], // misc debris
    [0.30, 0.20, 0.30], // small chip
];

export class DebrisManager {
    constructor(scene) {
        this.scene = scene;
        this.pieces = [];
    }

    // Spawn debris at car's world position with car's body color and yaw
    explode(position, yRotation, bodyColor) {
        for (let idx = 0; idx < SHAPES.length; idx++) {
            const [w, h, d] = SHAPES[idx];

            // Tires dark, misc bits silver/gray, rest car body color
            const col = (idx === 6 || idx === 7) ? 0x111111
                      : (idx === 8 || idx === 9) ? 0x888888
                      : bodyColor;

            const geo = new THREE.BoxGeometry(w, h, d);
            const mat = new THREE.MeshLambertMaterial({ color: col, transparent: true });
            const mesh = new THREE.Mesh(geo, mat);

            // Scatter starting positions inside the car footprint
            mesh.position.set(
                position.x + (Math.random() - 0.5) * 2.0,
                position.y + 0.4 + Math.random() * 0.6,
                position.z + (Math.random() - 0.5) * 2.0
            );
            // Start roughly aligned with the car, with small random twist
            mesh.rotation.y = yRotation + (Math.random() - 0.5) * 0.6;

            // Outward burst velocity
            const angle = Math.random() * Math.PI * 2;
            const speed = 5 + Math.random() * 9;

            this.pieces.push({
                mesh, mat,
                vx: Math.cos(angle) * speed,
                vy: 4 + Math.random() * 8,
                vz: Math.sin(angle) * speed,
                // Angular velocity (spin)
                ax: (Math.random() - 0.5) * 14,
                ay: (Math.random() - 0.5) * 14,
                az: (Math.random() - 0.5) * 14,
                life: 2.5 + Math.random(),
            });

            this.scene.add(mesh);
        }
    }

    update(dt) {
        let i = this.pieces.length;
        while (i--) {
            const p = this.pieces[i];
            p.life -= dt;

            // Gravity
            p.vy += GRAVITY * dt;

            // Move
            p.mesh.position.x += p.vx * dt;
            p.mesh.position.y += p.vy * dt;
            p.mesh.position.z += p.vz * dt;

            // Ground plane bounce
            if (p.mesh.position.y < 0.08) {
                p.mesh.position.y = 0.08;
                p.vy = -p.vy * 0.35;
                p.vx *= 0.78;
                p.vz *= 0.78;
                p.ax *= 0.45;
                p.az *= 0.45;
            }

            // Spin
            p.mesh.rotation.x += p.ax * dt;
            p.mesh.rotation.y += p.ay * dt;
            p.mesh.rotation.z += p.az * dt;

            // Fade out over the last second
            if (p.life < 1.0) {
                p.mat.opacity = Math.max(0, p.life);
            }

            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                p.mesh.geometry.dispose();
                p.mat.dispose();
                this.pieces.splice(i, 1);
            }
        }
    }

    clear() {
        for (const p of this.pieces) {
            this.scene.remove(p.mesh);
            p.mesh.geometry.dispose();
            p.mat.dispose();
        }
        this.pieces = [];
    }
}
