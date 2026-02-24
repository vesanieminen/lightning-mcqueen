import * as THREE from 'three';

// Track definitions
export const TRACK_DATA = [
    {
        id: 'oval',
        name: 'Radiator Springs Oval',
        description: 'A classic oval through the desert',
        icon: '🏜️',
        laps: 3,
        roadWidth: 18,
        buildTrack: buildOvalTrack,
        buildScenery: buildDesertScenery,
    },
    {
        id: 'circuit',
        name: 'Piston Cup Circuit',
        description: 'Race around the Piston Cup stadium',
        icon: '🏟️',
        laps: 3,
        roadWidth: 18,
        buildTrack: buildCircuitTrack,
        buildScenery: buildStadiumScenery,
    },
];

// Compute consistent track directions for a flat XZ-plane curve.
// Replaces Three.js computeFrenetFrames which is unreliable for planar curves
// (the binormal can flip randomly, breaking road mesh, curbs, and car positioning).
function computeTrackFrames(curve, segments) {
    const tangents = [];
    const binormals = []; // "right" vectors perpendicular to track in XZ plane

    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const tangent = curve.getTangent(t);
        tangent.y = 0;
        tangent.normalize();

        // Right-pointing perpendicular in XZ plane
        // If tangent is (tx, 0, tz), right is (-tz, 0, tx)
        const right = new THREE.Vector3(-tangent.z, 0, tangent.x);

        tangents.push(tangent);
        binormals.push(right);
    }

    return { tangents, binormals };
}

// Oval track
function buildOvalTrack() {
    const points = [];
    const a = 120; // semi-major axis
    const b = 60;  // semi-minor axis
    const segments = 80;

    for (let i = 0; i < segments; i++) {
        const t = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(
            Math.sin(t) * a,
            0,
            Math.cos(t) * b
        ));
    }

    return new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.5);
}

// Rounded rectangle circuit - clockwise to match oval direction
function buildCircuitTrack() {
    const points = [];
    const W = 100; // half-width
    const H = 55;  // half-height
    const R = 30;  // corner radius
    const S = 10;  // points per straight
    const C = 10;  // points per corner

    function addStraight(x1, z1, x2, z2) {
        for (let i = 0; i < S; i++) {
            const t = i / S;
            points.push(new THREE.Vector3(x1 + (x2 - x1) * t, 0, z1 + (z2 - z1) * t));
        }
    }

    function addCornerCW(cx, cz, startAngle) {
        for (let i = 0; i < C; i++) {
            const t = i / C;
            const angle = startAngle - t * (Math.PI / 2);
            points.push(new THREE.Vector3(cx + Math.cos(angle) * R, 0, cz + Math.sin(angle) * R));
        }
    }

    // Clockwise: top-right → right-down → bottom-left → left-up
    // Starting at top, going right (matches oval direction at t=0)
    addStraight(-(W - R), H, W - R, H);              // Top straight (going right)
    addCornerCW(W - R, H - R, Math.PI / 2);           // Top-right corner
    addStraight(W, H - R, W, -(H - R));              // Right straight (going down)
    addCornerCW(W - R, -(H - R), 0);                  // Bottom-right corner
    addStraight(W - R, -H, -(W - R), -H);            // Bottom straight (going left)
    addCornerCW(-(W - R), -(H - R), -Math.PI / 2);    // Bottom-left corner
    addStraight(-W, -(H - R), -W, H - R);            // Left straight (going up)
    addCornerCW(-(W - R), H - R, Math.PI);            // Top-left corner

    return new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.5);
}

// Build the 3D road mesh and walls for a track
export function buildTrackMesh(trackData) {
    const group = new THREE.Group();
    const curve = trackData.buildTrack();
    const roadWidth = trackData.roadWidth;

    // Compute reliable track frames (not Frenet)
    const frames = computeTrackFrames(curve, 200);
    const roadVertices = [];
    const roadIndices = [];
    const roadUVs = [];

    for (let i = 0; i <= 200; i++) {
        const t = i / 200;
        const point = curve.getPoint(t);
        const right = frames.binormals[i];

        const left = point.clone().add(right.clone().multiplyScalar(-roadWidth / 2));
        const rightPt = point.clone().add(right.clone().multiplyScalar(roadWidth / 2));

        left.y = 0.01;
        rightPt.y = 0.01;

        roadVertices.push(left.x, left.y, left.z);
        roadVertices.push(rightPt.x, rightPt.y, rightPt.z);

        roadUVs.push(0, t * 20);
        roadUVs.push(1, t * 20);

        if (i < 200) {
            const base = i * 2;
            roadIndices.push(base, base + 1, base + 2);
            roadIndices.push(base + 1, base + 3, base + 2);
        }
    }

    const roadGeo = new THREE.BufferGeometry();
    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadVertices, 3));
    roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUVs, 2));
    roadGeo.setIndex(roadIndices);
    roadGeo.computeVertexNormals();

    const roadMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    group.add(roadMesh);

    // Road center line (dashed yellow)
    const centerVertices = [];
    for (let i = 0; i <= 200; i++) {
        const t = i / 200;
        const point = curve.getPoint(t);
        centerVertices.push(point.x, 0.05, point.z);
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(centerVertices, 3));
    const lineMat = new THREE.LineDashedMaterial({ color: 0xF7D417, dashSize: 3, gapSize: 3 });
    const centerLine = new THREE.Line(lineGeo, lineMat);
    centerLine.computeLineDistances();
    group.add(centerLine);

    // Road curb strips (red/white like real racetracks)
    const curbWidth = 1.5;
    for (const side of [-1, 1]) {
        const curbVertices = [];
        const curbIndices = [];
        const curbColors = [];

        for (let i = 0; i <= 200; i++) {
            const t = i / 200;
            const point = curve.getPoint(t);
            const right = frames.binormals[i];

            const inner = point.clone().add(right.clone().multiplyScalar(side * (roadWidth / 2 - 0.2)));
            const outer = point.clone().add(right.clone().multiplyScalar(side * (roadWidth / 2 + curbWidth)));
            inner.y = 0.03;
            outer.y = 0.03;

            // For the left side (side=-1), swap inner/outer vertex order
            // to fix triangle winding so the face points up
            if (side === 1) {
                curbVertices.push(inner.x, inner.y, inner.z);
                curbVertices.push(outer.x, outer.y, outer.z);
            } else {
                curbVertices.push(outer.x, outer.y, outer.z);
                curbVertices.push(inner.x, inner.y, inner.z);
            }

            // Alternating red/white pattern
            const isRed = Math.floor(t * 40) % 2 === 0;
            const r = isRed ? 0.85 : 1.0;
            const g = isRed ? 0.15 : 1.0;
            const b = isRed ? 0.15 : 1.0;
            curbColors.push(r, g, b, r, g, b);

            if (i < 200) {
                const base = i * 2;
                curbIndices.push(base, base + 1, base + 2);
                curbIndices.push(base + 1, base + 3, base + 2);
            }
        }

        const curbGeo = new THREE.BufferGeometry();
        curbGeo.setAttribute('position', new THREE.Float32BufferAttribute(curbVertices, 3));
        curbGeo.setAttribute('color', new THREE.Float32BufferAttribute(curbColors, 3));
        curbGeo.setIndex(curbIndices);
        curbGeo.computeVertexNormals();

        const curbMat = new THREE.MeshLambertMaterial({ vertexColors: true });
        const curbMesh = new THREE.Mesh(curbGeo, curbMat);
        curbMesh.receiveShadow = true;
        group.add(curbMesh);
    }

    // Start/finish line
    const startPoint = curve.getPoint(0);
    const startTangent = frames.tangents[0];
    const angle = Math.atan2(startTangent.x, startTangent.z);

    const startGeo = new THREE.BoxGeometry(roadWidth, 0.05, 2);
    const startMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const startLine = new THREE.Mesh(startGeo, startMat);
    startLine.position.set(startPoint.x, 0.06, startPoint.z);
    startLine.rotation.y = angle;
    group.add(startLine);

    const checkerGeo = new THREE.BoxGeometry(roadWidth / 2, 0.06, 1);
    const checkerMat = new THREE.MeshLambertMaterial({ color: 0x000000 });
    const checker = new THREE.Mesh(checkerGeo, checkerMat);
    checker.position.set(startPoint.x, 0.07, startPoint.z);
    checker.rotation.y = angle;
    group.add(checker);

    // Ground plane
    const groundGeo = new THREE.PlaneGeometry(600, 600);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0xC4A86B });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    group.add(ground);

    // Build invisible walls for track boundaries
    const walls = buildInvisibleWalls(curve, roadWidth, frames);
    group.add(walls);

    // Build scenery
    const scenery = trackData.buildScenery(curve, roadWidth, frames);
    group.add(scenery);

    return { group, curve, frames, roadWidth };
}

// Invisible walls to keep cars on track
function buildInvisibleWalls(curve, roadWidth, frames) {
    const wallGroup = new THREE.Group();
    const wallHeight = 3;
    const wallSegments = 200;

    for (const side of [-1, 1]) {
        const wallVertices = [];
        const wallIndices = [];

        for (let i = 0; i <= wallSegments; i++) {
            const t = i / wallSegments;
            const point = curve.getPoint(t);
            const right = frames.binormals[i];
            const offset = right.clone().multiplyScalar(side * (roadWidth / 2 + 0.5));
            const base = point.clone().add(offset);

            wallVertices.push(base.x, 0, base.z);
            wallVertices.push(base.x, wallHeight, base.z);

            if (i < wallSegments) {
                const idx = i * 2;
                wallIndices.push(idx, idx + 1, idx + 2);
                wallIndices.push(idx + 1, idx + 3, idx + 2);
            }
        }

        const wallGeo = new THREE.BufferGeometry();
        wallGeo.setAttribute('position', new THREE.Float32BufferAttribute(wallVertices, 3));
        wallGeo.setIndex(wallIndices);
        wallGeo.computeVertexNormals();

        const wallMat = new THREE.MeshBasicMaterial({ visible: false });
        const wallMesh = new THREE.Mesh(wallGeo, wallMat);
        wallMesh.userData.isWall = true;
        wallMesh.userData.side = side;
        wallGroup.add(wallMesh);
    }

    return wallGroup;
}

// Scenery builders
function buildDesertScenery(curve, roadWidth, frames) {
    const scenery = new THREE.Group();

    // Cacti along the road
    const cactusGeo = new THREE.CylinderGeometry(0.3, 0.4, 4, 8);
    const cactusMat = new THREE.MeshLambertMaterial({ color: 0x2d5a27 });
    const cactusArmGeo = new THREE.CylinderGeometry(0.2, 0.25, 2, 8);

    for (let i = 0; i < 30; i++) {
        const t = i / 30;
        const point = curve.getPoint(t);
        const right = frames.binormals[Math.floor(t * 200)];
        const side = Math.random() > 0.5 ? 1 : -1;
        const distance = roadWidth / 2 + 8 + Math.random() * 30;
        const pos = point.clone().add(right.clone().multiplyScalar(side * distance));

        const cactus = new THREE.Mesh(cactusGeo, cactusMat);
        cactus.position.set(pos.x, 2, pos.z);
        cactus.castShadow = true;
        scenery.add(cactus);

        if (Math.random() > 0.4) {
            const arm = new THREE.Mesh(cactusArmGeo, cactusMat);
            arm.position.set(pos.x + 0.8, 2.5, pos.z);
            arm.rotation.z = Math.PI / 3;
            scenery.add(arm);
        }
    }

    // Red rock formations
    const rockColors = [0xCC5533, 0xBB4422, 0xAA3311, 0xDD6644];
    for (let i = 0; i < 15; i++) {
        const angle = (i / 15) * Math.PI * 2;
        const dist = 150 + Math.random() * 80;
        const x = Math.sin(angle) * dist;
        const z = Math.cos(angle) * dist;

        const height = 5 + Math.random() * 15;
        const width = 3 + Math.random() * 6;
        const rockGeo = new THREE.CylinderGeometry(width * 0.6, width, height, 6);
        const rockMat = new THREE.MeshLambertMaterial({
            color: rockColors[Math.floor(Math.random() * rockColors.length)]
        });
        const rock = new THREE.Mesh(rockGeo, rockMat);
        rock.position.set(x, height / 2, z);
        rock.rotation.y = Math.random() * Math.PI;
        rock.castShadow = true;
        scenery.add(rock);
    }

    // Sky sphere
    const skyGeo = new THREE.SphereGeometry(280, 32, 16);
    const skyMat = new THREE.MeshBasicMaterial({ color: 0x87CEEB, side: THREE.BackSide });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    scenery.add(sky);

    // Sun
    const sunGeo = new THREE.SphereGeometry(8, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xFFFF88 });
    const sun = new THREE.Mesh(sunGeo, sunMat);
    sun.position.set(100, 200, -100);
    scenery.add(sun);

    return scenery;
}

function buildStadiumScenery(curve, roadWidth, frames) {
    const scenery = new THREE.Group();

    // Stadium walls / grandstands
    const standMat = new THREE.MeshLambertMaterial({ color: 0x555577 });
    const standAccentMat = new THREE.MeshLambertMaterial({ color: 0xC1272D });

    for (let i = 0; i < 40; i++) {
        const t = i / 40;
        const point = curve.getPoint(t);
        const right = frames.binormals[Math.floor(t * 200)];
        const side = i % 2 === 0 ? 1 : -1;
        const distance = roadWidth / 2 + 12;
        const pos = point.clone().add(right.clone().multiplyScalar(side * distance));

        const height = 8 + Math.random() * 4;
        const standGeo = new THREE.BoxGeometry(6, height, 6);
        const mat = Math.random() > 0.7 ? standAccentMat : standMat;
        const stand = new THREE.Mesh(standGeo, mat);
        stand.position.set(pos.x, height / 2, pos.z);
        stand.castShadow = true;
        scenery.add(stand);
    }

    // Green ground (grass)
    const grassGeo = new THREE.PlaneGeometry(600, 600);
    const grassMat = new THREE.MeshLambertMaterial({ color: 0x3a7d2a });
    const grass = new THREE.Mesh(grassGeo, grassMat);
    grass.rotation.x = -Math.PI / 2;
    grass.position.y = -0.005;
    grass.receiveShadow = true;
    scenery.add(grass);

    // Flags and banners
    const flagColors = [0xC1272D, 0xF7D417, 0x2255CC, 0x33CC33];
    for (let i = 0; i < 20; i++) {
        const t = i / 20;
        const point = curve.getPoint(t);
        const right = frames.binormals[Math.floor(t * 200)];
        const side = i % 2 === 0 ? 1 : -1;
        const distance = roadWidth / 2 + 3;
        const pos = point.clone().add(right.clone().multiplyScalar(side * distance));

        const poleGeo = new THREE.CylinderGeometry(0.1, 0.1, 6, 6);
        const poleMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.set(pos.x, 3, pos.z);
        scenery.add(pole);

        const flagGeo = new THREE.BoxGeometry(1.5, 1, 0.05);
        const flagMat = new THREE.MeshLambertMaterial({ color: flagColors[i % flagColors.length] });
        const flag = new THREE.Mesh(flagGeo, flagMat);
        flag.position.set(pos.x + 0.8, 5.5, pos.z);
        scenery.add(flag);
    }

    // Sky
    const skyGeo = new THREE.SphereGeometry(280, 32, 16);
    const skyMat = new THREE.MeshBasicMaterial({ color: 0x5588CC, side: THREE.BackSide });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    scenery.add(sky);

    return scenery;
}
