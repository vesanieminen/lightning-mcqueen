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
        maxBankAngle: 0.12,   // ~7 degrees - gentle banking
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
        maxBankAngle: 0.28,   // ~16 degrees - NASCAR-style banking
        buildTrack: buildCircuitTrack,
        buildScenery: buildStadiumScenery,
    },
    {
        id: 'willys',
        name: "Willy's Butte",
        description: 'Switchbacks through the desert canyon',
        icon: '🏔️',
        laps: 2,
        roadWidth: 16,
        maxBankAngle: 0.15,
        groundSize: 900,
        buildTrack: buildWillysButteTrack,
        buildScenery: buildCanyonScenery,
    },
    {
        id: 'tokyo',
        name: 'Tokyo Sprint',
        description: 'Tight neon-lit city streets',
        icon: '🗼',
        laps: 2,
        roadWidth: 15,
        maxBankAngle: 0.08,
        groundSize: 800,
        groundColor: 0x444444,
        buildTrack: buildTokyoTrack,
        buildScenery: buildTokyoScenery,
    },
    {
        id: 'portocorsa',
        name: 'Porto Corsa',
        description: 'Sweeping curves along the Italian coast',
        icon: '🏖️',
        laps: 2,
        roadWidth: 16,
        maxBankAngle: 0.12,
        groundSize: 1000,
        groundColor: 0x3a7d2a,
        buildTrack: buildPortoCorsaTrack,
        buildScenery: buildPortoCorsaScenery,
    },
    {
        id: 'florida',
        name: 'Florida 500',
        description: 'Modern speedway with a twisty infield',
        icon: '🌴',
        laps: 2,
        roadWidth: 18,
        maxBankAngle: 0.22,
        groundSize: 900,
        groundColor: 0x3a7d2a,
        buildTrack: buildFlorida500Track,
        buildScenery: buildFloridaScenery,
    },
];

// Terrain height cache for scenery/debris placement
let _terrainSamples = null;

export function getTerrainHeightAt(x, z) {
    if (!_terrainSamples) return 0;
    let minDistSq = Infinity;
    let nearestY = 0;
    for (const s of _terrainSamples) {
        const dx = x - s.x;
        const dz = z - s.z;
        const d = dx * dx + dz * dz;
        if (d < minDistSq) { minDistSq = d; nearestY = s.y; }
    }
    return nearestY;
}

function cacheTerrainSamples(curve) {
    _terrainSamples = [];
    for (let i = 0; i < 200; i++) {
        _terrainSamples.push(curve.getPointAt(i / 200));
    }
}

// Compute consistent track directions for a 3D curve.
// Uses arc-length parameterization (getTangentAt) for uniform speed across the track.
// Stores both flat (XZ-projected) tangents for binormals/banking and full 3D tangents for pitch.
function computeTrackFrames(curve, segments, maxBankAngle = 0) {
    const tangents = [];
    const tangents3D = []; // full 3D tangent for car pitch calculation
    const binormals = []; // "right" vectors perpendicular to track in XZ plane
    const bankAngles = []; // banking angle at each segment (radians)

    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const tangent = curve.getTangentAt(t);

        // Store full 3D tangent before flattening
        tangents3D.push(tangent.clone());

        // Flatten to XZ plane for binormal/banking calculations
        tangent.y = 0;
        tangent.normalize();

        // Right-pointing perpendicular in XZ plane
        const right = new THREE.Vector3(-tangent.z, 0, tangent.x);

        tangents.push(tangent);
        binormals.push(right);
    }

    // Compute banking based on curvature (rate of tangent direction change)
    if (maxBankAngle > 0) {
        const rawCurvature = [];
        for (let i = 0; i <= segments; i++) {
            const prev = tangents[(i - 1 + segments + 1) % (segments + 1)];
            const next = tangents[(i + 1) % (segments + 1)];
            // Signed curvature: cross product Y component gives turn direction
            const cross = prev.x * next.z - prev.z * next.x;
            rawCurvature.push(cross);
        }

        // Smooth the curvature (fewer passes to keep banking focused on corners)
        let smoothed = [...rawCurvature];
        for (let pass = 0; pass < 4; pass++) {
            const temp = [...smoothed];
            for (let i = 0; i <= segments; i++) {
                const prev = temp[(i - 1 + segments + 1) % (segments + 1)];
                const next = temp[(i + 1) % (segments + 1)];
                smoothed[i] = prev * 0.25 + temp[i] * 0.5 + next * 0.25;
            }
        }

        // Normalize curvature to [-1, 1] range and scale to bank angle
        let maxCurv = 0;
        for (const c of smoothed) maxCurv = Math.max(maxCurv, Math.abs(c));
        if (maxCurv > 0.0001) {
            for (let i = 0; i <= segments; i++) {
                // Threshold: zero out very small banking on straights
                const normalized = smoothed[i] / maxCurv;
                bankAngles.push(Math.abs(normalized) < 0.1 ? 0 : -normalized * maxBankAngle);
            }
        } else {
            for (let i = 0; i <= segments; i++) bankAngles.push(0);
        }
    } else {
        for (let i = 0; i <= segments; i++) bankAngles.push(0);
    }

    return { tangents, tangents3D, binormals, bankAngles };
}

// Oval track — two gentle hills on the long straights
function buildOvalTrack() {
    const points = [];
    const a = 120; // semi-major axis
    const b = 60;  // semi-minor axis
    const segments = 80;

    for (let i = 0; i < segments; i++) {
        const t = (i / segments) * Math.PI * 2;
        // Two hills per lap: peaks at the midpoints of the long sides
        const y = (1 - Math.cos(t * 2)) * 3; // 0 to 6
        points.push(new THREE.Vector3(
            Math.sin(t) * a,
            y,
            Math.cos(t) * b
        ));
    }

    return new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.5);
}

// Rounded rectangle circuit - clockwise to match oval direction
// Hill on back straight (bottom), flat on front straight (top)
function buildCircuitTrack() {
    const points = [];
    const W = 100; // half-width
    const H = 55;  // half-height
    const R = 30;  // corner radius
    const S = 10;  // points per straight
    const C = 10;  // points per corner

    function addStraight(x1, z1, x2, z2, y1 = 0, y2 = 0) {
        for (let i = 0; i < S; i++) {
            const t = i / S;
            points.push(new THREE.Vector3(
                x1 + (x2 - x1) * t,
                y1 + (y2 - y1) * t,
                z1 + (z2 - z1) * t
            ));
        }
    }

    function addCornerCW(cx, cz, startAngle, y = 0) {
        for (let i = 0; i < C; i++) {
            const t = i / C;
            const angle = startAngle - t * (Math.PI / 2);
            points.push(new THREE.Vector3(cx + Math.cos(angle) * R, y, cz + Math.sin(angle) * R));
        }
    }

    // Clockwise: top-right → right-down → bottom-left → left-up
    addStraight(-(W - R), H, W - R, H, 0, 0);              // Top straight: flat
    addCornerCW(W - R, H - R, Math.PI / 2, 0);              // Top-right: flat
    addStraight(W, H - R, W, -(H - R), 0, 3);              // Right: climb to 3
    addCornerCW(W - R, -(H - R), 0, 3);                     // Bottom-right: high
    addStraight(W - R, -H, -(W - R), -H, 3, 3);            // Bottom straight: stay high
    addCornerCW(-(W - R), -(H - R), -Math.PI / 2, 3);       // Bottom-left: high
    addStraight(-W, -(H - R), -W, H - R, 3, 0);            // Left: descend to 0
    addCornerCW(-(W - R), H - R, Math.PI, 0);               // Top-left: flat

    return new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.5);
}

// ---- NEW TRACK BUILDERS ----

// Willy's Butte: Desert canyon switchbacks with dramatic elevation
function buildWillysButteTrack() {
    const pts = [
        [0, 90, 0],         // start — valley floor
        [60, 95, 3],
        [130, 80, 8],       // climbing
        [180, 50, 12],      // high ridge
        [200, -10, 10],     // still high
        [180, -70, 6],      // descending
        [140, -110, 2],     // dropping into canyon
        [80, -130, 0],      // canyon floor
        [20, -120, 2],      // slight rise
        [-30, -90, 5],      // climbing
        [-50, -50, 8],      // mid-height
        [-80, -20, 10],     // higher
        [-120, -40, 13],    // canyon rim — peak
        [-150, -80, 10],    // descending
        [-190, -120, 6],    // coming down
        [-230, -130, 3],    // low section
        [-270, -100, 1],    // near valley
        [-290, -50, 0],     // valley floor
        [-280, 10, 2],      // gentle rise
        [-250, 60, 4],      // climbing
        [-210, 90, 3],      // slight descent
        [-160, 100, 2],     // lowering
        [-100, 95, 1],      // approaching start
        [-50, 100, 0],      // back to start height
    ];

    const points = pts.map(([x, z, y]) => new THREE.Vector3(x, y, z));
    return new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.5);
}

// Tokyo Sprint: Tight city grid with a slight overpass section
function buildTokyoTrack() {
    const pts = [
        [0, 100, 0],         // start straight
        [60, 100, 0],
        [120, 95, 1],
        [160, 70, 2],        // slight rise into turns
        [165, 30, 2],
        [160, -20, 1],
        [155, -70, 0],
        [130, -110, 0],
        [170, -120, 1],
        [210, -115, 2],      // overpass section
        [230, -90, 2],
        [220, -60, 1],
        [230, -30, 0],
        [235, 10, 0],
        [220, 50, 1],
        [190, 70, 1],
        [150, 60, 0],
        [110, 30, 0],
        [70, 10, 0],
        [30, -10, 0],
        [-10, 10, 0],
        [-50, 30, 0],
        [-80, 60, 0],
        [-90, 90, 0],
        [-70, 110, 0],
        [-30, 105, 0],
    ];

    const points = pts.map(([x, z, y]) => new THREE.Vector3(x, y, z));
    return new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.5);
}

// Porto Corsa: Sweeping Italian coastal road with coastal hills
function buildPortoCorsaTrack() {
    const pts = [
        [0, 120, 0],          // start at coast level
        [70, 125, 2],
        [140, 110, 5],        // climbing along coast
        [200, 80, 8],         // hilltop
        [240, 40, 6],         // descending
        [260, -10, 3],
        [250, -70, 1],        // down toward harbor
        [220, -120, 0],       // harbor turn — lowest
        [170, -150, 0],
        [110, -155, 1],
        [50, -140, 3],        // climbing back
        [0, -110, 5],
        [-50, -90, 7],        // ascending
        [-100, -100, 9],      // hill section
        [-150, -130, 7],
        [-200, -140, 4],
        [-250, -120, 2],
        [-280, -80, 1],
        [-290, -30, 0],       // low coastal
        [-280, 30, 2],        // climbing
        [-250, 80, 4],        // uphill
        [-210, 110, 3],
        [-160, 120, 2],
        [-100, 125, 1],
        [-50, 122, 0],        // back to start
    ];

    const points = pts.map(([x, z, y]) => new THREE.Vector3(x, y, z));
    return new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.5);
}

// Florida 500: Tri-oval speedway with gentle elevation changes
function buildFlorida500Track() {
    const pts = [
        [0, 100, 0],          // start/finish straight
        [60, 100, 0],
        [120, 95, 1],
        [170, 80, 2],         // turn 1 rise
        [200, 50, 3],
        [210, 10, 3],
        [200, -30, 2],        // turn 2
        [170, -60, 1],
        [130, -70, 0],
        [90, -65, 0],
        [60, -50, 0],         // infield — flat
        [40, -20, 1],
        [20, 10, 2],
        [40, 40, 2],
        [70, 50, 1],
        [60, 20, 1],
        [30, -10, 0],
        [0, -30, 0],          // infield hairpin
        [-30, -20, 0],
        [-40, 20, 1],
        [-30, 60, 2],
        [-50, 90, 3],         // back straight rise
        [-80, 110, 4],
        [-120, 115, 4],       // back straight high point
        [-180, 112, 3],
        [-230, 105, 2],
        [-260, 90, 1],
        [-275, 60, 0],
        [-265, 30, 0],
        [-240, 10, 0],
        [-200, 15, 0],
        [-160, 30, 0],
        [-130, 55, 0],
        [-100, 80, 0],
        [-60, 95, 0],
    ];

    const points = pts.map(([x, z, y]) => new THREE.Vector3(x, y, z));
    return new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.5);
}

// Helper: check if a position is too close to any part of the road
// Samples the curve at intervals and rejects positions within minClearance of the road center
function isTooCloseToRoad(pos, curve, minClearance, samples = 50) {
    for (let i = 0; i < samples; i++) {
        const pt = curve.getPointAt(i / samples);
        const dx = pos.x - pt.x;
        const dz = pos.z - pt.z;
        if (dx * dx + dz * dz < minClearance * minClearance) return true;
    }
    return false;
}

// Place scenery objects with road-safety checks
function placeScenery(count, curve, frames, roadWidth, minDist, maxDist, createFn) {
    const clearance = roadWidth / 2 + minDist;
    const placed = [];
    let attempts = 0;
    while (placed.length < count && attempts < count * 4) {
        attempts++;
        const t = placed.length / count + (Math.random() * 0.5 / count);
        const tClamped = ((t % 1) + 1) % 1;
        const point = curve.getPointAt(tClamped);
        const idx = Math.floor(tClamped * 200) % 201;
        const right = frames.binormals[idx];
        const side = attempts % 2 === 0 ? 1 : -1;
        const dist = roadWidth / 2 + minDist + Math.random() * maxDist;
        const pos = point.clone().add(right.clone().multiplyScalar(side * dist));

        // Verify this position is actually clear of the road (important on winding tracks)
        if (isTooCloseToRoad(pos, curve, clearance)) continue;

        const obj = createFn(pos);
        if (obj) placed.push(obj);
    }
    return placed;
}

// ---- NEW SCENERY BUILDERS ----

function buildCanyonScenery(curve, roadWidth, frames) {
    const scenery = new THREE.Group();

    // Tall canyon walls (red/orange rock formations lining the track)
    const rockColors = [0xCC5533, 0xBB4422, 0xAA3311, 0xDD6644, 0xC44820];
    placeScenery(60, curve, frames, roadWidth, 15, 30, (pos) => {
        const height = 8 + Math.random() * 20;
        const width = 4 + Math.random() * 8;
        const geo = new THREE.CylinderGeometry(width * 0.5, width, height, 5 + Math.floor(Math.random() * 4));
        const mat = new THREE.MeshLambertMaterial({ color: rockColors[Math.floor(Math.random() * rockColors.length)] });
        const rock = new THREE.Mesh(geo, mat);
        rock.position.set(pos.x, pos.y + height / 2, pos.z);
        rock.rotation.y = Math.random() * Math.PI;
        rock.castShadow = true;
        scenery.add(rock);
        return rock;
    });

    // Cacti
    const cactusMat = new THREE.MeshLambertMaterial({ color: 0x2d5a27 });
    placeScenery(40, curve, frames, roadWidth, 8, 40, (pos) => {
        const geo = new THREE.CylinderGeometry(0.25, 0.35, 2 + Math.random() * 3, 6);
        const cactus = new THREE.Mesh(geo, cactusMat);
        cactus.position.set(pos.x, pos.y + 1.5, pos.z);
        scenery.add(cactus);
        return cactus;
    });

    // Sky + sun
    const skyGeo = new THREE.SphereGeometry(420, 32, 16);
    const skyMat = new THREE.MeshBasicMaterial({ color: 0xE8A050, side: THREE.BackSide }); // warm sunset
    scenery.add(new THREE.Mesh(skyGeo, skyMat));

    const sunGeo = new THREE.SphereGeometry(12, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xFFCC44 });
    const sun = new THREE.Mesh(sunGeo, sunMat);
    sun.position.set(150, 250, -150);
    scenery.add(sun);

    return scenery;
}

function buildTokyoScenery(curve, roadWidth, frames) {
    const scenery = new THREE.Group();

    // Neon-colored city buildings
    const buildingColors = [0x3344AA, 0xAA2255, 0x22AA66, 0x8833CC, 0xCC6622, 0x2288CC];
    placeScenery(70, curve, frames, roadWidth, 14, 20, (pos) => {
        const height = 6 + Math.random() * 18;
        const width = 3 + Math.random() * 5;
        const depth = 3 + Math.random() * 5;
        const geo = new THREE.BoxGeometry(width, height, depth);
        const color = buildingColors[Math.floor(Math.random() * buildingColors.length)];
        const mat = new THREE.MeshLambertMaterial({ color });
        const building = new THREE.Mesh(geo, mat);
        building.position.set(pos.x, pos.y + height / 2, pos.z);
        building.rotation.y = Math.random() * Math.PI;
        building.castShadow = true;
        scenery.add(building);

        // Neon accent strip on some buildings
        if (Math.random() > 0.5) {
            const stripGeo = new THREE.BoxGeometry(width + 0.1, 0.3, depth + 0.1);
            const stripMat = new THREE.MeshBasicMaterial({ color: 0xFF2266 });
            const strip = new THREE.Mesh(stripGeo, stripMat);
            strip.position.set(pos.x, pos.y + height * 0.7, pos.z);
            strip.rotation.y = building.rotation.y;
            scenery.add(strip);
        }
        return building;
    });

    // Night sky
    const skyGeo = new THREE.SphereGeometry(380, 32, 16);
    const skyMat = new THREE.MeshBasicMaterial({ color: 0x111133, side: THREE.BackSide });
    scenery.add(new THREE.Mesh(skyGeo, skyMat));

    return scenery;
}

function buildPortoCorsaScenery(curve, roadWidth, frames) {
    const scenery = new THREE.Group();

    // Mediterranean buildings
    const houseColors = [0xF5E6C8, 0xE8D4AA, 0xFFF8DC, 0xD4A76A, 0xF0C890];
    const roofColors = [0xCC5533, 0xBB4422, 0xAA5544];
    placeScenery(50, curve, frames, roadWidth, 14, 25, (pos) => {
        const height = 4 + Math.random() * 6;
        const width = 3 + Math.random() * 4;
        const houseGeo = new THREE.BoxGeometry(width, height, width);
        const houseMat = new THREE.MeshLambertMaterial({ color: houseColors[Math.floor(Math.random() * houseColors.length)] });
        const house = new THREE.Mesh(houseGeo, houseMat);
        house.position.set(pos.x, pos.y + height / 2, pos.z);
        house.rotation.y = Math.random() * Math.PI;
        house.castShadow = true;
        scenery.add(house);

        const roofGeo = new THREE.ConeGeometry(width * 0.8, 2, 4);
        const roofMat = new THREE.MeshLambertMaterial({ color: roofColors[Math.floor(Math.random() * roofColors.length)] });
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.set(pos.x, pos.y + height + 1, pos.z);
        roof.rotation.y = Math.PI / 4;
        scenery.add(roof);
        return house;
    });

    // Palm trees
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
    const leafMat = new THREE.MeshLambertMaterial({ color: 0x228B22, side: THREE.DoubleSide });
    placeScenery(30, curve, frames, roadWidth, 8, 25, (pos) => {
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, 5, 6), trunkMat);
        trunk.position.set(pos.x, pos.y + 2.5, pos.z);
        scenery.add(trunk);

        for (let l = 0; l < 5; l++) {
            const leaf = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 0.6), leafMat);
            leaf.position.set(pos.x, pos.y + 5.2, pos.z);
            leaf.rotation.y = (l / 5) * Math.PI * 2;
            leaf.rotation.x = -0.4;
            scenery.add(leaf);
        }
        return trunk;
    });

    // Water plane (ocean on one side)
    const waterGeo = new THREE.PlaneGeometry(1000, 400);
    const waterMat = new THREE.MeshLambertMaterial({ color: 0x2277AA, transparent: true, opacity: 0.85 });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, -0.2, -250);
    scenery.add(water);

    // Sky
    const skyGeo = new THREE.SphereGeometry(480, 32, 16);
    const skyMat = new THREE.MeshBasicMaterial({ color: 0x6BB8E8, side: THREE.BackSide });
    scenery.add(new THREE.Mesh(skyGeo, skyMat));

    const sunGeo = new THREE.SphereGeometry(10, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xFFEE88 });
    const sun = new THREE.Mesh(sunGeo, sunMat);
    sun.position.set(-200, 280, 100);
    scenery.add(sun);

    return scenery;
}

function buildFloridaScenery(curve, roadWidth, frames) {
    const scenery = new THREE.Group();

    // Modern grandstands
    const standColors = [0x6688AA, 0x557799, 0x778899];
    placeScenery(50, curve, frames, roadWidth, 15, 15, (pos) => {
        const height = 5 + Math.random() * 10;
        const geo = new THREE.BoxGeometry(5, height, 5);
        const mat = new THREE.MeshLambertMaterial({ color: standColors[Math.floor(Math.random() * standColors.length)] });
        const stand = new THREE.Mesh(geo, mat);
        stand.position.set(pos.x, pos.y + height / 2, pos.z);
        stand.castShadow = true;
        scenery.add(stand);
        return stand;
    });

    // Palm trees
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
    const leafMat = new THREE.MeshLambertMaterial({ color: 0x228B22, side: THREE.DoubleSide });
    placeScenery(25, curve, frames, roadWidth, 8, 30, (pos) => {
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, 6, 6), trunkMat);
        trunk.position.set(pos.x, pos.y + 3, pos.z);
        scenery.add(trunk);

        for (let l = 0; l < 5; l++) {
            const leaf = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.6), leafMat);
            leaf.position.set(pos.x, pos.y + 6.2, pos.z);
            leaf.rotation.y = (l / 5) * Math.PI * 2;
            leaf.rotation.x = -0.4;
            scenery.add(leaf);
        }
        return trunk;
    });

    // Flags (thin poles are fine close to the road)
    const flagColors = [0xCC2244, 0x2244CC, 0xFFCC00, 0x22CC44];
    placeScenery(24, curve, frames, roadWidth, 4, 2, (pos) => {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 5, 6), new THREE.MeshLambertMaterial({ color: 0x999999 }));
        pole.position.set(pos.x, pos.y + 2.5, pos.z);
        scenery.add(pole);

        const flag = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.04), new THREE.MeshLambertMaterial({ color: flagColors[Math.floor(Math.random() * flagColors.length)] }));
        flag.position.set(pos.x + 0.6, pos.y + 4.8, pos.z);
        scenery.add(flag);
        return pole;
    });

    // Sky
    const skyGeo = new THREE.SphereGeometry(420, 32, 16);
    const skyMat = new THREE.MeshBasicMaterial({ color: 0x66AADD, side: THREE.BackSide });
    scenery.add(new THREE.Mesh(skyGeo, skyMat));

    return scenery;
}

// Build elevation-aware terrain that follows track hills
function buildTerrain(curve, groundSize, groundColor) {
    const subdivisions = 60;
    const geo = new THREE.PlaneGeometry(groundSize, groundSize, subdivisions, subdivisions);
    geo.rotateX(-Math.PI / 2);

    // Sample track heights at intervals
    const trackSamples = [];
    for (let i = 0; i < 200; i++) {
        trackSamples.push(curve.getPointAt(i / 200));
    }

    const positions = geo.attributes.position;
    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const z = positions.getZ(i);

        // Find nearest track point
        let minDistSq = Infinity;
        let nearestY = 0;
        for (const sample of trackSamples) {
            const dx = x - sample.x;
            const dz = z - sample.z;
            const distSq = dx * dx + dz * dz;
            if (distSq < minDistSq) {
                minDistSq = distSq;
                nearestY = sample.y;
            }
        }

        // Quadratic falloff: terrain matches track near the road, flattens far away
        const dist = Math.sqrt(minDistSq);
        const falloffDist = groundSize * 0.3;
        const falloff = Math.max(0, 1 - (dist / falloffDist) * (dist / falloffDist));
        positions.setY(i, nearestY * falloff - 0.1);
    }

    geo.computeVertexNormals();
    const mat = new THREE.MeshLambertMaterial({ color: groundColor });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    return mesh;
}

// Build the 3D road mesh and walls for a track
export function buildTrackMesh(trackData) {
    const group = new THREE.Group();
    const curve = trackData.buildTrack();
    const roadWidth = trackData.roadWidth;

    // Compute reliable track frames (not Frenet)
    const maxBank = trackData.maxBankAngle || 0;
    const frames = computeTrackFrames(curve, 200, maxBank);
    const roadVertices = [];
    const roadIndices = [];
    const roadUVs = [];

    for (let i = 0; i <= 200; i++) {
        const t = i / 200;
        const point = curve.getPointAt(t);
        const right = frames.binormals[i];
        const bank = frames.bankAngles[i];

        const left = point.clone().add(right.clone().multiplyScalar(-roadWidth / 2));
        const rightPt = point.clone().add(right.clone().multiplyScalar(roadWidth / 2));

        // Banking: tilt the road cross-section around the center line
        // Raise the center so the low side stays above ground
        const bankLift = Math.abs(Math.sin(bank)) * (roadWidth / 2);
        left.y = point.y + 0.01 + bankLift - Math.sin(bank) * (roadWidth / 2);
        rightPt.y = point.y + 0.01 + bankLift + Math.sin(bank) * (roadWidth / 2);

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
        const point = curve.getPointAt(t);
        const clBank = frames.bankAngles[i];
        const clBankLift = Math.abs(Math.sin(clBank)) * (roadWidth / 2);
        centerVertices.push(point.x, point.y + 0.05 + clBankLift, point.z);
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
            const point = curve.getPointAt(t);
            const right = frames.binormals[i];
            const bank = frames.bankAngles[i];

            const inner = point.clone().add(right.clone().multiplyScalar(side * (roadWidth / 2 - 0.2)));
            const outer = point.clone().add(right.clone().multiplyScalar(side * (roadWidth / 2 + curbWidth)));
            // Follow road banking for curb Y positions (include bankLift to match road surface)
            const curbBankLift = Math.abs(Math.sin(bank)) * (roadWidth / 2);
            inner.y = point.y + 0.03 + curbBankLift + Math.sin(bank) * side * (roadWidth / 2 - 0.2);
            outer.y = point.y + 0.03 + curbBankLift + Math.sin(bank) * side * (roadWidth / 2 + curbWidth);

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
    startLine.position.set(startPoint.x, startPoint.y + 0.06, startPoint.z);
    startLine.rotation.y = angle;
    group.add(startLine);

    const checkerGeo = new THREE.BoxGeometry(roadWidth / 2, 0.06, 1);
    const checkerMat = new THREE.MeshLambertMaterial({ color: 0x000000 });
    const checker = new THREE.Mesh(checkerGeo, checkerMat);
    checker.position.set(startPoint.x, startPoint.y + 0.07, startPoint.z);
    checker.rotation.y = angle;
    group.add(checker);

    // Elevation-aware terrain ground
    const groundSize = trackData.groundSize || 600;
    const groundColor = trackData.groundColor || 0xC4A86B;
    cacheTerrainSamples(curve);
    const ground = buildTerrain(curve, groundSize, groundColor);
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
            const point = curve.getPointAt(t);
            const right = frames.binormals[i];
            const offset = right.clone().multiplyScalar(side * (roadWidth / 2 + 0.5));
            const base = point.clone().add(offset);

            wallVertices.push(base.x, point.y, base.z);
            wallVertices.push(base.x, point.y + wallHeight, base.z);

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

    placeScenery(30, curve, frames, roadWidth, 8, 30, (pos) => {
        const cactus = new THREE.Mesh(cactusGeo, cactusMat);
        cactus.position.set(pos.x, pos.y + 2, pos.z);
        cactus.castShadow = true;
        scenery.add(cactus);

        if (Math.random() > 0.4) {
            const arm = new THREE.Mesh(cactusArmGeo, cactusMat);
            arm.position.set(pos.x + 0.8, pos.y + 2.5, pos.z);
            arm.rotation.z = Math.PI / 3;
            scenery.add(arm);
        }
        return cactus;
    });

    // Red rock formations (placed far from track so safe)
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

    placeScenery(40, curve, frames, roadWidth, 12, 6, (pos) => {
        const height = 8 + Math.random() * 4;
        const standGeo = new THREE.BoxGeometry(6, height, 6);
        const mat = Math.random() > 0.7 ? standAccentMat : standMat;
        const stand = new THREE.Mesh(standGeo, mat);
        stand.position.set(pos.x, pos.y + height / 2, pos.z);
        stand.castShadow = true;
        scenery.add(stand);
        return stand;
    });

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
    placeScenery(20, curve, frames, roadWidth, 4, 2, (pos) => {
        const poleGeo = new THREE.CylinderGeometry(0.1, 0.1, 6, 6);
        const poleMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.set(pos.x, pos.y + 3, pos.z);
        scenery.add(pole);

        const flagGeo = new THREE.BoxGeometry(1.5, 1, 0.05);
        const flagMat = new THREE.MeshLambertMaterial({ color: flagColors[Math.floor(Math.random() * flagColors.length)] });
        const flag = new THREE.Mesh(flagGeo, flagMat);
        flag.position.set(pos.x + 0.8, pos.y + 5.5, pos.z);
        scenery.add(flag);
        return pole;
    });

    // Sky
    const skyGeo = new THREE.SphereGeometry(280, 32, 16);
    const skyMat = new THREE.MeshBasicMaterial({ color: 0x5588CC, side: THREE.BackSide });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    scenery.add(sky);

    return scenery;
}
