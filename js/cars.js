import * as THREE from 'three';

// Car character definitions
export const CAR_DATA = [
    // ── Cars 1 ──────────────────────────────────────────────────────────
    {
        id: 'mcqueen',
        name: 'Lightning McQueen',
        bodyType: 'stockCar',
        bodyColor: 0xC1272D,
        accentColor: 0xF7D417,
        number: '95',
        eyeColor: 0x4488cc,
        description: 'Speed. I am speed.',
    },
    {
        id: 'chick',
        name: 'Chick Hicks',
        bodyType: 'stockCar',
        bodyColor: 0x2A8E30,
        accentColor: 0xDAA520,
        number: '86',
        eyeColor: 0x442200,
        description: 'Ka-chicka!',
    },
    {
        id: 'king',
        name: 'The King',
        bodyType: 'stockCar',
        bodyColor: 0x3A86D8,
        accentColor: 0xE31837,
        number: '43',
        eyeColor: 0x336688,
        description: 'Good night, Chicky.',
    },
    {
        id: 'doc',
        name: 'Doc Hudson',
        bodyType: 'classic',
        bodyColor: 0x1B3A6B,
        accentColor: 0xC0C0C0,
        number: '',
        eyeColor: 0x336699,
        description: 'I know every inch of that road.',
    },
    {
        id: 'mater',
        name: 'Mater',
        bodyType: 'pickup',
        bodyColor: 0x8B6914,
        accentColor: 0x6B4F12,
        number: '',
        eyeColor: 0x66aa66,
        description: 'Tow Mater, at your service!',
    },
    {
        id: 'sally',
        name: 'Sally',
        bodyType: 'sports',
        bodyColor: 0x6CA6CD,
        accentColor: 0x4A8AAD,
        number: '',
        eyeColor: 0x6688cc,
        description: 'Welcome to Radiator Springs!',
    },
    {
        id: 'ramone',
        name: 'Ramone',
        bodyType: 'lowrider',
        bodyColor: 0x6A0DAD,
        accentColor: 0xFFD700,
        number: '',
        eyeColor: 0x553300,
        description: 'Low and slow, that\'s how we roll.',
    },
    {
        id: 'flo',
        name: 'Flo',
        bodyType: 'classic',
        bodyColor: 0xFF7A45,
        accentColor: 0xFFD700,
        number: '',
        eyeColor: 0x885566,
        description: 'Welcome to Flo\'s V8 Cafe!',
    },
    {
        id: 'luigi',
        name: 'Luigi',
        bodyType: 'compact',
        bodyColor: 0xFCE03E,
        accentColor: 0xFFFFFF,
        number: '',
        eyeColor: 0x447700,
        description: 'Luigi follow only the Ferrari!',
    },
    {
        id: 'fillmore',
        name: 'Fillmore',
        bodyType: 'van',
        bodyColor: 0x4A7C3F,
        accentColor: 0xF0E68C,
        number: '',
        eyeColor: 0x448844,
        description: 'I\'m telling you, organic fuel!',
    },
    {
        id: 'sarge',
        name: 'Sarge',
        bodyType: 'suv',
        bodyColor: 0x4B5320,
        accentColor: 0x8B7355,
        number: '',
        eyeColor: 0x445533,
        description: 'Fall in, soldier!',
    },
    {
        id: 'sheriff',
        name: 'Sheriff',
        bodyType: 'classic',
        bodyColor: 0x222222,
        accentColor: 0xffffff,
        number: '',
        eyeColor: 0x556655,
        description: 'Keep it under the speed limit!',
    },
    // ── Cars 2 ──────────────────────────────────────────────────────────
    {
        id: 'francesco',
        name: 'Francesco Bernoulli',
        bodyType: 'formula',
        bodyColor: 0xFF2800,
        accentColor: 0x009246,
        number: '1',
        eyeColor: 0x442233,
        description: 'Francesco is the fastest!',
    },
    {
        id: 'finn',
        name: 'Finn McMissile',
        bodyType: 'sports',
        bodyColor: 0x2B5EA7,
        accentColor: 0xC0C0C0,
        number: '',
        eyeColor: 0x334466,
        description: 'My name is Finn McMissile.',
    },
    {
        id: 'holley',
        name: 'Holley Shiftwell',
        bodyType: 'sports',
        bodyColor: 0xAA44CC,
        accentColor: 0xDD99FF,
        number: '',
        eyeColor: 0x553388,
        description: 'Agent Shiftwell, reporting for duty!',
    },
    {
        id: 'carla',
        name: 'Carla Veloso',
        bodyType: 'sports',
        bodyColor: 0x00A651,
        accentColor: 0xFFDF00,
        number: '8',
        eyeColor: 0x446622,
        description: 'Carla Veloso, ready to race!',
    },
    // ── Cars 3 ──────────────────────────────────────────────────────────
    {
        id: 'cruz',
        name: 'Cruz Ramirez',
        bodyType: 'stockCar',
        bodyColor: 0xFFD700,
        accentColor: 0xE8C100,
        number: '51',
        eyeColor: 0x886644,
        description: 'Cruz to the finish!',
    },
    {
        id: 'storm',
        name: 'Jackson Storm',
        bodyType: 'stockCar',
        bodyColor: 0x2F2F2F,
        accentColor: 0x1155ff,
        number: '20',
        eyeColor: 0x334455,
        description: 'You know my name.',
    },
    {
        id: 'smokey',
        name: 'Smokey',
        bodyType: 'pickup',
        bodyColor: 0x1A3050,
        accentColor: 0xD4AC0D,
        number: '',
        eyeColor: 0x334455,
        description: 'That\'s Hudson\'s secret move.',
    },
    {
        id: 'cal',
        name: 'Cal Weathers',
        bodyType: 'stockCar',
        bodyColor: 0x7EC8E3,
        accentColor: 0xFFFFFF,
        number: '4',
        eyeColor: 0x4488CC,
        description: 'Cal Weathers, let\'s go!',
    },
    {
        id: 'natalie',
        name: 'Natalie Certain',
        bodyType: 'compact',
        bodyColor: 0xFF6B9D,
        accentColor: 0xFFFFFF,
        number: '',
        eyeColor: 0x553355,
        description: 'According to my calculations...',
    },
    {
        id: 'bobby',
        name: 'Bobby Swift',
        bodyType: 'stockCar',
        bodyColor: 0x1E90FF,
        accentColor: 0xFFFFFF,
        number: '21',
        eyeColor: 0x446688,
        description: 'Bobby Swift is in the house!',
    },
];

// ── Body-type dimension presets ────────────────────────────────────────
// Each preset defines: body (w,h,l), cabin (w,h,l,zOff), ride height,
// wheel radius, wheel track width, and axle positions (front/rear z).
const BODY_PRESETS = {
    stockCar: {
        body: [2.0, 0.55, 4.2], cabin: [1.7, 0.45, 2.0, -0.2],
        ride: 0.45, wR: 0.35, track: 1.05, axleF: 1.35, axleR: -1.35,
    },
    classic: {
        body: [2.1, 0.7, 4.4], cabin: [1.6, 0.55, 1.8, -0.3],
        ride: 0.55, wR: 0.38, track: 1.1, axleF: 1.4, axleR: -1.4,
    },
    pickup: {
        body: [2.1, 0.75, 4.6], cabin: [1.7, 0.6, 1.4, 0.6],
        ride: 0.6, wR: 0.4, track: 1.1, axleF: 1.5, axleR: -1.5,
    },
    sports: {
        body: [1.85, 0.45, 3.8], cabin: [1.55, 0.4, 1.6, -0.1],
        ride: 0.35, wR: 0.32, track: 0.98, axleF: 1.2, axleR: -1.2,
    },
    lowrider: {
        body: [2.15, 0.55, 4.6], cabin: [1.65, 0.5, 1.8, -0.2],
        ride: 0.3, wR: 0.3, track: 1.08, axleF: 1.4, axleR: -1.5,
    },
    compact: {
        body: [1.6, 0.55, 3.0], cabin: [1.4, 0.5, 1.6, -0.1],
        ride: 0.4, wR: 0.28, track: 0.85, axleF: 0.9, axleR: -0.9,
    },
    van: {
        body: [2.0, 0.9, 4.0], cabin: [1.8, 0.7, 2.6, -0.1],
        ride: 0.5, wR: 0.38, track: 1.05, axleF: 1.3, axleR: -1.3,
    },
    suv: {
        body: [2.0, 0.8, 3.8], cabin: [1.7, 0.6, 1.8, -0.1],
        ride: 0.65, wR: 0.4, track: 1.08, axleF: 1.2, axleR: -1.2,
    },
    formula: {
        body: [1.6, 0.35, 4.4], cabin: [1.1, 0.4, 1.2, -0.4],
        ride: 0.3, wR: 0.34, track: 1.15, axleF: 1.5, axleR: -1.5,
    },
};

// Build a 3D car model from character data
export function createCarModel(carData, isPlayer = false) {
    const group = new THREE.Group();
    group.userData.carId = carData.id;

    const preset = BODY_PRESETS[carData.bodyType] || BODY_PRESETS.stockCar;
    const [bW, bH, bL] = preset.body;
    const [cW, cH, cL, cZ] = preset.cabin;

    const bodyMat = new THREE.MeshLambertMaterial({ color: carData.bodyColor });
    const accentMat = new THREE.MeshLambertMaterial({ color: carData.accentColor });
    const blackMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const whiteMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const eyeMat = new THREE.MeshLambertMaterial({ color: carData.eyeColor });
    const glassMat = new THREE.MeshLambertMaterial({ color: 0xaaddff, transparent: true, opacity: 0.5 });

    const bodyY = preset.ride + bH * 0.5;

    // Main body
    const bodyGeo = new THREE.BoxGeometry(bW, bH, bL);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = bodyY;
    group.add(body);

    // Upper cabin
    const cabinY = bodyY + bH * 0.5 + cH * 0.5;
    const cabinGeo = new THREE.BoxGeometry(cW, cH, cL);
    const cabin = new THREE.Mesh(cabinGeo, bodyMat);
    cabin.position.set(0, cabinY, cZ);
    group.add(cabin);

    // Windshield
    const wsZ = cZ + cL * 0.5 + 0.025;
    const windshieldGeo = new THREE.BoxGeometry(cW + 0.02, cH + 0.02, 0.05);
    const windshield = new THREE.Mesh(windshieldGeo, glassMat);
    windshield.position.set(0, cabinY, wsZ);
    group.add(windshield);

    // Eyes on windshield
    const eyeY = cabinY + cH * 0.12;
    const eyeZ = wsZ + 0.03;
    const eyeScale = Math.min(cW / 1.7, 1); // scale eyes with cabin width
    const eyeWhiteGeo = new THREE.SphereGeometry(0.18, 12, 8);
    const eyePupilGeo = new THREE.SphereGeometry(0.1, 10, 8);

    const leftEyeWhite = new THREE.Mesh(eyeWhiteGeo, whiteMat);
    leftEyeWhite.position.set(-0.3 * eyeScale, eyeY, eyeZ);
    leftEyeWhite.scale.set(eyeScale, 1.2 * eyeScale, 0.5);
    group.add(leftEyeWhite);

    const leftPupil = new THREE.Mesh(eyePupilGeo, eyeMat);
    leftPupil.position.set(-0.3 * eyeScale, eyeY, eyeZ + 0.1);
    leftPupil.scale.set(eyeScale, 1.2 * eyeScale, 0.5);
    group.add(leftPupil);

    const rightEyeWhite = new THREE.Mesh(eyeWhiteGeo, whiteMat);
    rightEyeWhite.position.set(0.3 * eyeScale, eyeY, eyeZ);
    rightEyeWhite.scale.set(eyeScale, 1.2 * eyeScale, 0.5);
    group.add(rightEyeWhite);

    const rightPupil = new THREE.Mesh(eyePupilGeo, eyeMat);
    rightPupil.position.set(0.3 * eyeScale, eyeY, eyeZ + 0.1);
    rightPupil.scale.set(eyeScale, 1.2 * eyeScale, 0.5);
    group.add(rightPupil);

    // Mouth / front bumper smile
    const smileGeo = new THREE.BoxGeometry(bW * 0.4, 0.08, 0.05);
    const smile = new THREE.Mesh(smileGeo, blackMat);
    smile.position.set(0, bodyY - bH * 0.25, bL * 0.5 + 0.01);
    group.add(smile);

    // ── Wheels ──────────────────────────────────────────────────────
    const wheelGeo = new THREE.CylinderGeometry(preset.wR, preset.wR, 0.25, 16);
    const hubGeo = new THREE.CylinderGeometry(preset.wR * 0.42, preset.wR * 0.42, 0.26, 8);
    const wheelY = preset.wR;
    const wheelPositions = [
        [-preset.track, wheelY, preset.axleF],
        [ preset.track, wheelY, preset.axleF],
        [-preset.track, wheelY, preset.axleR],
        [ preset.track, wheelY, preset.axleR],
    ];

    const wheels = [];
    const frontWheelGroups = [];
    for (let wi = 0; wi < wheelPositions.length; wi++) {
        const pos = wheelPositions[wi];
        const isFront = pos[2] > 0;

        const wheel = new THREE.Mesh(wheelGeo, blackMat);
        wheel.rotation.z = Math.PI / 2;
        const hub = new THREE.Mesh(hubGeo, accentMat);
        hub.rotation.z = Math.PI / 2;

        if (isFront) {
            const steerGroup = new THREE.Group();
            steerGroup.position.set(...pos);
            steerGroup.add(wheel);
            steerGroup.add(hub);
            group.add(steerGroup);
            frontWheelGroups.push(steerGroup);
        } else {
            wheel.position.set(...pos);
            hub.position.set(...pos);
            group.add(wheel);
            group.add(hub);
        }
        wheels.push(wheel);
    }
    group.userData.wheels = wheels;
    group.userData.frontWheelGroups = frontWheelGroups;

    // ── Body-type specific details ─────────────────────────────────
    const bt = carData.bodyType || 'stockCar';

    // Spoiler for stock cars & formula
    if (bt === 'stockCar' || bt === 'formula') {
        const spW = bt === 'formula' ? bW + 0.6 : bW * 0.9;
        const spoilerGeo = new THREE.BoxGeometry(spW, 0.08, 0.4);
        const spoiler = new THREE.Mesh(spoilerGeo, accentMat);
        spoiler.position.set(0, cabinY + cH * 0.5 + 0.15, preset.axleR - 0.2);
        group.add(spoiler);

        const standGeo = new THREE.BoxGeometry(0.08, 0.3, 0.08);
        const sL = new THREE.Mesh(standGeo, accentMat);
        sL.position.set(-spW * 0.38, cabinY + cH * 0.5, preset.axleR - 0.2);
        group.add(sL);
        const sR = new THREE.Mesh(standGeo, accentMat);
        sR.position.set(spW * 0.38, cabinY + cH * 0.5, preset.axleR - 0.2);
        group.add(sR);
    }

    // Side stripe for numbered cars
    if (carData.number) {
        const stripeGeo = new THREE.BoxGeometry(0.02, bH * 0.4, bL * 0.6);
        const stripeL = new THREE.Mesh(stripeGeo, accentMat);
        stripeL.position.set(-bW * 0.5 - 0.01, bodyY, 0);
        group.add(stripeL);
        const stripeR = new THREE.Mesh(stripeGeo, accentMat);
        stripeR.position.set(bW * 0.5 + 0.01, bodyY, 0);
        group.add(stripeR);
    }

    // Pickup truck bed
    if (bt === 'pickup') {
        const bedGeo = new THREE.BoxGeometry(bW - 0.1, 0.08, bL * 0.4);
        const bed = new THREE.Mesh(bedGeo, bodyMat);
        bed.position.set(0, bodyY + bH * 0.5, -bL * 0.25);
        group.add(bed);
        // Side rails
        const railGeo = new THREE.BoxGeometry(0.08, 0.3, bL * 0.4);
        const rL = new THREE.Mesh(railGeo, accentMat);
        rL.position.set(-bW * 0.45, bodyY + bH * 0.5 + 0.15, -bL * 0.25);
        group.add(rL);
        const rR = new THREE.Mesh(railGeo, accentMat);
        rR.position.set(bW * 0.45, bodyY + bH * 0.5 + 0.15, -bL * 0.25);
        group.add(rR);
    }

    // Lowrider: chrome trim along sides + low skirts
    if (bt === 'lowrider') {
        const chromeMat = new THREE.MeshLambertMaterial({ color: 0xcccccc });
        const trimGeo = new THREE.BoxGeometry(0.04, 0.1, bL * 0.85);
        const tL = new THREE.Mesh(trimGeo, chromeMat);
        tL.position.set(-bW * 0.5 - 0.02, bodyY - bH * 0.15, 0);
        group.add(tL);
        const tR = new THREE.Mesh(trimGeo, chromeMat);
        tR.position.set(bW * 0.5 + 0.02, bodyY - bH * 0.15, 0);
        group.add(tR);
        // Flame accent on the side
        const flameMat = new THREE.MeshLambertMaterial({ color: carData.accentColor });
        const flameGeo = new THREE.BoxGeometry(0.03, bH * 0.35, bL * 0.3);
        const fL = new THREE.Mesh(flameGeo, flameMat);
        fL.position.set(-bW * 0.5 - 0.015, bodyY + bH * 0.1, bL * 0.15);
        group.add(fL);
        const fR = new THREE.Mesh(flameGeo, flameMat);
        fR.position.set(bW * 0.5 + 0.015, bodyY + bH * 0.1, bL * 0.15);
        group.add(fR);
    }

    // Van: larger windshield, flower decals
    if (bt === 'van') {
        // Extend windshield up
        const bigWSGeo = new THREE.BoxGeometry(cW + 0.02, cH * 0.6, 0.05);
        const bigWS = new THREE.Mesh(bigWSGeo, glassMat);
        bigWS.position.set(0, cabinY + cH * 0.3, cZ + cL * 0.5 + 0.03);
        group.add(bigWS);
        // Flower accent dots on sides
        const dotMat = new THREE.MeshLambertMaterial({ color: carData.accentColor });
        const dotGeo = new THREE.SphereGeometry(0.12, 8, 6);
        for (let d = 0; d < 3; d++) {
            const dL = new THREE.Mesh(dotGeo, dotMat);
            dL.position.set(-bW * 0.5 - 0.01, bodyY + bH * 0.2, -0.5 + d * 0.6);
            dL.scale.set(0.3, 1, 1);
            group.add(dL);
            const dR = new THREE.Mesh(dotGeo, dotMat);
            dR.position.set(bW * 0.5 + 0.01, bodyY + bH * 0.2, -0.5 + d * 0.6);
            dR.scale.set(0.3, 1, 1);
            group.add(dR);
        }
    }

    // SUV: roof rack, boxy fender flares
    if (bt === 'suv') {
        // Roof rack bars
        const rackGeo = new THREE.BoxGeometry(cW * 0.9, 0.06, 0.1);
        for (let r = 0; r < 3; r++) {
            const bar = new THREE.Mesh(rackGeo, blackMat);
            bar.position.set(0, cabinY + cH * 0.5 + 0.03, cZ - cL * 0.3 + r * cL * 0.3);
            group.add(bar);
        }
        // Side rails for roof rack
        const sideRailGeo = new THREE.BoxGeometry(0.06, 0.06, cL * 0.85);
        const srL = new THREE.Mesh(sideRailGeo, blackMat);
        srL.position.set(-cW * 0.42, cabinY + cH * 0.5 + 0.03, cZ);
        group.add(srL);
        const srR = new THREE.Mesh(sideRailGeo, blackMat);
        srR.position.set(cW * 0.42, cabinY + cH * 0.5 + 0.03, cZ);
        group.add(srR);
    }

    // Formula: exposed front suspension arms, nose cone
    if (bt === 'formula') {
        // Nose cone (tapered front)
        const noseGeo = new THREE.BoxGeometry(bW * 0.4, bH * 0.6, 0.6);
        const nose = new THREE.Mesh(noseGeo, bodyMat);
        nose.position.set(0, bodyY - bH * 0.1, bL * 0.5 + 0.3);
        group.add(nose);
        // Front wing
        const fwGeo = new THREE.BoxGeometry(bW + 0.5, 0.06, 0.35);
        const fw = new THREE.Mesh(fwGeo, accentMat);
        fw.position.set(0, bodyY - bH * 0.3, bL * 0.5 + 0.5);
        group.add(fw);
        // Suspension arms (black struts to front wheels)
        const armGeo = new THREE.BoxGeometry(0.06, 0.06, 0.8);
        const armL = new THREE.Mesh(armGeo, blackMat);
        armL.position.set(-preset.track * 0.5, bodyY - bH * 0.2, preset.axleF - 0.3);
        armL.rotation.y = 0.35;
        group.add(armL);
        const armR = new THREE.Mesh(armGeo, blackMat);
        armR.position.set(preset.track * 0.5, bodyY - bH * 0.2, preset.axleF - 0.3);
        armR.rotation.y = -0.35;
        group.add(armR);
    }

    // Sports: sleek side intakes
    if (bt === 'sports') {
        const intakeGeo = new THREE.BoxGeometry(0.04, bH * 0.3, 0.5);
        const intakeMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const iL = new THREE.Mesh(intakeGeo, intakeMat);
        iL.position.set(-bW * 0.5 - 0.02, bodyY + bH * 0.05, -0.3);
        group.add(iL);
        const iR = new THREE.Mesh(intakeGeo, intakeMat);
        iR.position.set(bW * 0.5 + 0.02, bodyY + bH * 0.05, -0.3);
        group.add(iR);
    }

    // Classic: chrome bumpers front & rear, whitewall hint on wheels
    if (bt === 'classic') {
        const chromeMat = new THREE.MeshLambertMaterial({ color: 0xcccccc });
        const bumperGeo = new THREE.BoxGeometry(bW * 0.85, 0.12, 0.12);
        const bF = new THREE.Mesh(bumperGeo, chromeMat);
        bF.position.set(0, bodyY - bH * 0.3, bL * 0.5 + 0.06);
        group.add(bF);
        const bR = new THREE.Mesh(bumperGeo, chromeMat);
        bR.position.set(0, bodyY - bH * 0.3, -bL * 0.5 - 0.06);
        group.add(bR);
    }

    // Compact: rounded roof accent
    if (bt === 'compact') {
        const roofGeo = new THREE.SphereGeometry(cW * 0.45, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
        const roof = new THREE.Mesh(roofGeo, bodyMat);
        roof.position.set(0, cabinY + cH * 0.35, cZ);
        group.add(roof);
    }

    // ── Tail lights ────────────────────────────────────────────────
    const tailGeo = new THREE.BoxGeometry(bW * 0.15, 0.15, 0.05);
    const tailMat = new THREE.MeshLambertMaterial({ color: 0xff0000, emissive: 0x440000 });
    const tailL = new THREE.Mesh(tailGeo, tailMat);
    tailL.position.set(-bW * 0.3, bodyY, -bL * 0.5 - 0.01);
    group.add(tailL);
    const tailR = new THREE.Mesh(tailGeo, tailMat);
    tailR.position.set(bW * 0.3, bodyY, -bL * 0.5 - 0.01);
    group.add(tailR);

    // ── Headlights ─────────────────────────────────────────────────
    const headGeo = new THREE.BoxGeometry(bW * 0.15, 0.15, 0.05);
    const headMat = new THREE.MeshLambertMaterial({ color: 0xffffcc, emissive: 0x333300 });
    const headL = new THREE.Mesh(headGeo, headMat);
    headL.position.set(-bW * 0.3, bodyY, bL * 0.5 + 0.01);
    group.add(headL);
    const headR = new THREE.Mesh(headGeo, headMat);
    headR.position.set(bW * 0.3, bodyY, bL * 0.5 + 0.01);
    group.add(headR);

    // Player highlight ring
    if (isPlayer) {
        const ringR = Math.max(bW, bL * 0.5) * 0.95;
        const ringGeo = new THREE.RingGeometry(ringR, ringR + 0.3, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xF7D417, side: THREE.DoubleSide, transparent: true, opacity: 0.4 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.05;
        group.add(ring);
        group.userData.playerRing = ring;
    }

    // Shadows
    group.traverse(child => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    return group;
}
