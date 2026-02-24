import * as THREE from 'three';

// Car character definitions
export const CAR_DATA = [
    {
        id: 'mcqueen',
        name: 'Lightning McQueen',
        bodyColor: 0xC1272D,
        accentColor: 0xF7D417,
        number: '95',
        eyeColor: 0x4488cc,
        description: 'Speed. I am speed.',
    },
    {
        id: 'mater',
        name: 'Mater',
        bodyColor: 0x8B6914,
        accentColor: 0x6B4F12,
        number: '',
        eyeColor: 0x66aa66,
        description: 'Tow Mater, at your service!',
    },
    {
        id: 'sally',
        name: 'Sally',
        bodyColor: 0x6CA6CD,
        accentColor: 0x4A8AAD,
        number: '',
        eyeColor: 0x6688cc,
        description: 'Welcome to Radiator Springs!',
    },
    {
        id: 'cruz',
        name: 'Cruz Ramirez',
        bodyColor: 0xFFD700,
        accentColor: 0xE8C100,
        number: '51',
        eyeColor: 0x886644,
        description: 'Cruz to the finish!',
    },
    {
        id: 'storm',
        name: 'Jackson Storm',
        bodyColor: 0x2F2F2F,
        accentColor: 0x1155ff,
        number: '20',
        eyeColor: 0x334455,
        description: 'You know my name.',
    },
    {
        id: 'sheriff',
        name: 'Sheriff',
        bodyColor: 0x222222,
        accentColor: 0xffffff,
        number: '',
        eyeColor: 0x556655,
        description: 'Keep it under the speed limit!',
    },
];

// Build a 3D car model from character data
export function createCarModel(carData, isPlayer = false) {
    const group = new THREE.Group();
    group.userData.carId = carData.id;

    const bodyMat = new THREE.MeshLambertMaterial({ color: carData.bodyColor });
    const accentMat = new THREE.MeshLambertMaterial({ color: carData.accentColor });
    const blackMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const whiteMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const eyeMat = new THREE.MeshLambertMaterial({ color: carData.eyeColor });
    const glassMat = new THREE.MeshLambertMaterial({ color: 0xaaddff, transparent: true, opacity: 0.5 });

    // Main body - lower box
    const bodyGeo = new THREE.BoxGeometry(2.0, 0.6, 4.0);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.5;
    group.add(body);

    // Upper cabin / hood area
    const cabinGeo = new THREE.BoxGeometry(1.7, 0.5, 2.2);
    const cabin = new THREE.Mesh(cabinGeo, bodyMat);
    cabin.position.set(0, 1.0, -0.3);
    group.add(cabin);

    // Windshield (where eyes go - like Cars movie)
    const windshieldGeo = new THREE.BoxGeometry(1.72, 0.52, 0.05);
    const windshield = new THREE.Mesh(windshieldGeo, glassMat);
    windshield.position.set(0, 1.0, 0.82);
    group.add(windshield);

    // Eyes on windshield (signature Cars look)
    const eyeWhiteGeo = new THREE.SphereGeometry(0.18, 12, 8);
    const eyePupilGeo = new THREE.SphereGeometry(0.1, 10, 8);

    // Left eye
    const leftEyeWhite = new THREE.Mesh(eyeWhiteGeo, whiteMat);
    leftEyeWhite.position.set(-0.3, 1.1, 0.85);
    leftEyeWhite.scale.set(1, 1.2, 0.5);
    group.add(leftEyeWhite);

    const leftPupil = new THREE.Mesh(eyePupilGeo, eyeMat);
    leftPupil.position.set(-0.3, 1.1, 0.95);
    leftPupil.scale.set(1, 1.2, 0.5);
    group.add(leftPupil);

    // Right eye
    const rightEyeWhite = new THREE.Mesh(eyeWhiteGeo, whiteMat);
    rightEyeWhite.position.set(0.3, 1.1, 0.85);
    rightEyeWhite.scale.set(1, 1.2, 0.5);
    group.add(rightEyeWhite);

    const rightPupil = new THREE.Mesh(eyePupilGeo, eyeMat);
    rightPupil.position.set(0.3, 1.1, 0.95);
    rightPupil.scale.set(1, 1.2, 0.5);
    group.add(rightPupil);

    // Mouth / front bumper smile
    const smileGeo = new THREE.BoxGeometry(0.8, 0.08, 0.05);
    const smile = new THREE.Mesh(smileGeo, blackMat);
    smile.position.set(0, 0.35, 2.01);
    group.add(smile);

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 16);
    const wheelPositions = [
        [-1.05, 0.35, 1.2],  // front-left
        [1.05, 0.35, 1.2],   // front-right
        [-1.05, 0.35, -1.2], // rear-left
        [1.05, 0.35, -1.2],  // rear-right
    ];

    const wheels = [];
    for (const pos of wheelPositions) {
        const wheel = new THREE.Mesh(wheelGeo, blackMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(...pos);
        group.add(wheel);
        wheels.push(wheel);

        // Hubcap
        const hubGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.26, 8);
        const hub = new THREE.Mesh(hubGeo, accentMat);
        hub.rotation.z = Math.PI / 2;
        hub.position.set(...pos);
        group.add(hub);
    }
    group.userData.wheels = wheels;

    // Spoiler for race cars
    if (carData.number) {
        const spoilerGeo = new THREE.BoxGeometry(1.8, 0.08, 0.4);
        const spoiler = new THREE.Mesh(spoilerGeo, accentMat);
        spoiler.position.set(0, 1.35, -1.6);
        group.add(spoiler);

        const spoilerStandGeo = new THREE.BoxGeometry(0.08, 0.3, 0.08);
        const standL = new THREE.Mesh(spoilerStandGeo, accentMat);
        standL.position.set(-0.7, 1.2, -1.6);
        group.add(standL);
        const standR = new THREE.Mesh(spoilerStandGeo, accentMat);
        standR.position.set(0.7, 1.2, -1.6);
        group.add(standR);
    }

    // Number decal (side stripe)
    if (carData.number) {
        const stripeGeo = new THREE.BoxGeometry(0.02, 0.25, 2.5);

        const stripeL = new THREE.Mesh(stripeGeo, accentMat);
        stripeL.position.set(-1.01, 0.55, 0);
        group.add(stripeL);

        const stripeR = new THREE.Mesh(stripeGeo, accentMat);
        stripeR.position.set(1.01, 0.55, 0);
        group.add(stripeR);
    }

    // Tail lights
    const tailGeo = new THREE.BoxGeometry(0.3, 0.15, 0.05);
    const tailMat = new THREE.MeshLambertMaterial({ color: 0xff0000, emissive: 0x440000 });
    const tailL = new THREE.Mesh(tailGeo, tailMat);
    tailL.position.set(-0.6, 0.55, -2.01);
    group.add(tailL);
    const tailR = new THREE.Mesh(tailGeo, tailMat);
    tailR.position.set(0.6, 0.55, -2.01);
    group.add(tailR);

    // Headlights
    const headGeo = new THREE.BoxGeometry(0.3, 0.15, 0.05);
    const headMat = new THREE.MeshLambertMaterial({ color: 0xffffcc, emissive: 0x333300 });
    const headL = new THREE.Mesh(headGeo, headMat);
    headL.position.set(-0.6, 0.55, 2.01);
    group.add(headL);
    const headR = new THREE.Mesh(headGeo, headMat);
    headR.position.set(0.6, 0.55, 2.01);
    group.add(headR);

    // Player highlight ring
    if (isPlayer) {
        const ringGeo = new THREE.RingGeometry(1.8, 2.1, 32);
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
