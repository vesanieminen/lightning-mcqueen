import * as THREE from 'three';
import { CAR_DATA, createCarModel } from './cars.js';
import { TRACK_DATA, buildTrackMesh } from './tracks.js';
import { CarRacer, Controls, RaceCamera } from './racing.js';
import { AIDriver } from './ai.js';
import {
    showTitleScreen, showCharacterSelect, showTrackSelect,
    showRaceHUD, showCountdown, updateHUD, showResults, clearUI
} from './ui.js';
import {
    initAudio, startEngineSound, updateEngineSound, stopEngineSound,
    playCountdownBeep, playWinSound
} from './sounds.js';

// Game states
const STATES = {
    TITLE: 'title',
    SELECT_CAR: 'select_car',
    SELECT_TRACK: 'select_track',
    COUNTDOWN: 'countdown',
    RACING: 'racing',
    RESULTS: 'results',
};

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.state = STATES.TITLE;
        this.selectedCarId = null;
        this.selectedTrackId = null;

        // Three.js setup
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
        this.camera.position.set(0, 20, 40);
        this.camera.lookAt(0, 0, 0);

        // Lighting
        this.setupLighting();

        // Resize handler
        window.addEventListener('resize', () => this.onResize());

        // Game objects
        this.controls = null;
        this.raceCamera = null;
        this.playerRacer = null;
        this.aiDrivers = [];
        this.allRacers = [];
        this.trackData = null;
        this.raceElapsed = 0;
        this.raceStarted = false;
        this.raceFinished = false;
        this.countdownTime = 0;

        // Clock for delta time
        this.clock = new THREE.Clock();

        // Audio
        initAudio();

        // Start
        this.enterState(STATES.TITLE);
        this.animate();
    }

    setupLighting() {
        // Ambient light
        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambient);

        // Directional light (sun)
        const sun = new THREE.DirectionalLight(0xffffff, 1.0);
        sun.position.set(50, 80, 30);
        sun.castShadow = true;
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        sun.shadow.camera.near = 0.5;
        sun.shadow.camera.far = 300;
        sun.shadow.camera.left = -150;
        sun.shadow.camera.right = 150;
        sun.shadow.camera.top = 150;
        sun.shadow.camera.bottom = -150;
        this.scene.add(sun);

        // Hemisphere light for nice sky/ground color blend
        const hemi = new THREE.HemisphereLight(0x87CEEB, 0x8B7355, 0.4);
        this.scene.add(hemi);
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    enterState(newState) {
        this.state = newState;

        switch (newState) {
            case STATES.TITLE:
                this.cleanupRace();
                this.scene.background = new THREE.Color(0x1a0a2e);
                showTitleScreen(() => this.enterState(STATES.SELECT_CAR));
                break;

            case STATES.SELECT_CAR:
                showCharacterSelect((carId) => {
                    this.selectedCarId = carId;
                    this.enterState(STATES.SELECT_TRACK);
                });
                break;

            case STATES.SELECT_TRACK:
                showTrackSelect((trackId) => {
                    this.selectedTrackId = trackId;
                    this.enterState(STATES.COUNTDOWN);
                });
                break;

            case STATES.COUNTDOWN:
                this.setupRace();
                this.startCountdown();
                break;

            case STATES.RACING:
                this.raceStarted = true;
                startEngineSound();
                break;

            case STATES.RESULTS:
                stopEngineSound();
                playWinSound();
                this.showRaceResults();
                break;
        }
    }

    setupRace() {
        this.cleanupRace();

        // Get track data
        const trackDef = TRACK_DATA.find(t => t.id === this.selectedTrackId);
        this.trackData = buildTrackMesh(trackDef);

        this.scene.add(this.trackData.group);
        this.scene.background = null; // let sky sphere handle it

        const curve = this.trackData.curve;
        const frames = this.trackData.frames;
        const roadWidth = this.trackData.roadWidth;

        // Create player car
        const playerCarData = CAR_DATA.find(c => c.id === this.selectedCarId);
        const playerModel = createCarModel(playerCarData, true);
        this.scene.add(playerModel);

        this.playerRacer = new CarRacer(playerModel, curve, frames, roadWidth, 0, true);
        this.playerRacer.totalLaps = trackDef.laps;
        this.allRacers = [this.playerRacer];

        // Create AI cars (other characters)
        this.aiDrivers = [];
        const aiCars = CAR_DATA.filter(c => c.id !== this.selectedCarId);
        const numAI = Math.min(aiCars.length, 5); // up to 5 AI opponents

        for (let i = 0; i < numAI; i++) {
            const aiData = aiCars[i];
            const aiModel = createCarModel(aiData, false);
            this.scene.add(aiModel);

            // Stagger AI starting positions behind player
            const startOffset = -0.01 * (i + 1); // behind the player
            const aiRacer = new CarRacer(aiModel, curve, frames, roadWidth, startOffset, false);
            aiRacer.totalLaps = trackDef.laps;

            // Give AI different lane positions
            aiRacer.lateralOffset = ((i % 3) - 1) * 0.4;

            const aiDriver = new AIDriver(aiRacer);
            this.aiDrivers.push(aiDriver);
            this.allRacers.push(aiRacer);
        }

        // Controls
        this.controls = new Controls();
        this.raceCamera = new RaceCamera(this.camera);

        // Race state
        this.raceElapsed = 0;
        this.raceStarted = false;
        this.raceFinished = false;
        this.finishOrder = [];

        // Show HUD
        showRaceHUD();

        // Re-setup touch controls after HUD is rendered
        setTimeout(() => {
            if (this.controls) this.controls._setupTouch();
        }, 100);
    }

    startCountdown() {
        this.countdownTime = 0;
        const countdownSequence = [3, 2, 1, 'GO!'];
        let step = 0;

        const doCount = () => {
            if (step < countdownSequence.length) {
                showCountdown(countdownSequence[step]);
                playCountdownBeep(countdownSequence[step] === 'GO!');
                step++;
                setTimeout(doCount, 1000);
            } else {
                this.enterState(STATES.RACING);
            }
        };

        setTimeout(doCount, 500);
    }

    cleanupRace() {
        stopEngineSound();

        // Remove track and cars from scene
        while (this.scene.children.length > 3) {
            // Keep the 3 lights
            const child = this.scene.children[this.scene.children.length - 1];
            this.scene.remove(child);
        }

        if (this.controls) {
            this.controls.destroy();
            this.controls = null;
        }

        this.playerRacer = null;
        this.aiDrivers = [];
        this.allRacers = [];
        this.trackData = null;
        this.raceCamera = null;
        this.finishOrder = [];
    }

    update(dt) {
        if (this.state !== STATES.RACING && this.state !== STATES.COUNTDOWN) return;
        if (!this.raceStarted) return;

        this.raceElapsed += dt;

        // Update player
        const steerInput = this.controls ? this.controls.getSteerInput() : 0;
        this.playerRacer.update(dt, steerInput);

        // Update engine sound pitch based on speed
        if (this.playerRacer) {
            updateEngineSound(this.playerRacer.speed / this.playerRacer.maxSpeed);
        }

        // Update AI
        for (const ai of this.aiDrivers) {
            ai.update(dt, this.raceElapsed);
        }

        // Resolve car-to-car collisions
        CarRacer.resolveCollisions(this.allRacers);

        // Check for lap completion / finish
        for (const racer of this.allRacers) {
            if (!racer.finished && racer.lap >= racer.totalLaps) {
                racer.finished = true;
                racer.finishTime = this.raceElapsed;
                this.finishOrder.push(racer);
            }
        }

        // Calculate positions
        const sorted = [...this.allRacers].sort((a, b) => b.getEffectiveDistance() - a.getEffectiveDistance());
        const playerPosition = sorted.indexOf(this.playerRacer) + 1;

        // Update HUD
        updateHUD(
            this.playerRacer.lap,
            this.playerRacer.totalLaps,
            playerPosition,
            this.allRacers.length
        );

        // Check if race is over (all finished or player finished)
        if (this.playerRacer.finished && !this.raceFinished) {
            this.raceFinished = true;
            // Wait a moment then show results
            setTimeout(() => {
                // Fill in any unfinished racers by current position
                for (const racer of sorted) {
                    if (!this.finishOrder.includes(racer)) {
                        this.finishOrder.push(racer);
                    }
                }
                this.enterState(STATES.RESULTS);
            }, 2000);
        }

        // Update camera
        if (this.raceCamera) {
            this.raceCamera.update(this.playerRacer);
        }
    }

    showRaceResults() {
        const results = this.finishOrder.map(racer => ({
            carId: racer.model.userData.carId,
            time: racer.finishTime,
        }));

        showResults(results, this.selectedCarId, () => {
            this.enterState(STATES.TITLE);
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const dt = this.clock.getDelta();

        this.update(dt);

        this.renderer.render(this.scene, this.camera);
    }
}

// Start the game!
const game = new Game();
