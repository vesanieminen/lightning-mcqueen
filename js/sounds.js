// Simple Web Audio API sounds - no external files needed

let audioCtx = null;

function getCtx() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
}

// Initialize audio on first user interaction
export function initAudio() {
    const resume = () => {
        getCtx();
        document.removeEventListener('click', resume);
        document.removeEventListener('keydown', resume);
    };
    document.addEventListener('click', resume);
    document.addEventListener('keydown', resume);
}

// Engine sound
let engineOsc = null;
let engineGain = null;

export function startEngineSound() {
    const ctx = getCtx();
    if (engineOsc) return;

    engineOsc = ctx.createOscillator();
    engineGain = ctx.createGain();

    engineOsc.type = 'sawtooth';
    engineOsc.frequency.value = 80;
    engineGain.gain.value = 0.06;

    engineOsc.connect(engineGain);
    engineGain.connect(ctx.destination);
    engineOsc.start();
}

export function updateEngineSound(speedRatio) {
    if (!engineOsc) return;
    engineOsc.frequency.value = 55 + speedRatio * 100;
    engineGain.gain.value = 0.02 + speedRatio * 0.06;
}

export function stopEngineSound() {
    if (engineOsc) {
        try { engineOsc.stop(); } catch (e) { /* already stopped */ }
        engineOsc = null;
        engineGain = null;
    }
}

// Countdown beep
export function playCountdownBeep(isGo = false) {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = isGo ? 880 : 440;
    gain.gain.value = 0.25;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
}

// Car collision hit sound - metallic clang
let lastHitTime = 0;
export function playHitSound() {
    const ctx = getCtx();
    const now = ctx.currentTime;
    // Debounce: don't play more than once per 200ms
    if (now - lastHitTime < 0.2) return;
    lastHitTime = now;

    // Metallic impact: mix of noise burst + low thump + high ping
    // Noise burst (crash texture)
    const bufferSize = ctx.sampleRate * 0.08;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        noiseData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
    }
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.15;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 2000;
    noiseFilter.Q.value = 1.5;
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseSource.start(now);
    noiseSource.stop(now + 0.08);

    // Low thump
    const thump = ctx.createOscillator();
    const thumpGain = ctx.createGain();
    thump.type = 'sine';
    thump.frequency.value = 120;
    thump.frequency.exponentialRampToValueAtTime(60, now + 0.1);
    thumpGain.gain.setValueAtTime(0.2, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    thump.connect(thumpGain);
    thumpGain.connect(ctx.destination);
    thump.start(now);
    thump.stop(now + 0.15);

    // High metallic ping
    const ping = ctx.createOscillator();
    const pingGain = ctx.createGain();
    ping.type = 'triangle';
    ping.frequency.value = 1800;
    pingGain.gain.setValueAtTime(0.08, now);
    pingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    ping.connect(pingGain);
    pingGain.connect(ctx.destination);
    ping.start(now);
    ping.stop(now + 0.12);
}

// Big car explosion crash sound
export function playCrashSound() {
    const ctx = getCtx();
    const now = ctx.currentTime;

    // Explosion noise burst (full-spectrum)
    const burstSize = ctx.sampleRate * 0.55;
    const burstBuf = ctx.createBuffer(1, burstSize, ctx.sampleRate);
    const burstData = burstBuf.getChannelData(0);
    for (let i = 0; i < burstSize; i++) {
        burstData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / burstSize, 1.8);
    }
    const burst = ctx.createBufferSource();
    burst.buffer = burstBuf;
    const burstGain = ctx.createGain();
    burstGain.gain.value = 0.45;
    burst.connect(burstGain);
    burstGain.connect(ctx.destination);
    burst.start(now);
    burst.stop(now + 0.55);

    // Deep bass boom
    const boom = ctx.createOscillator();
    const boomGain = ctx.createGain();
    boom.type = 'sine';
    boom.frequency.setValueAtTime(90, now);
    boom.frequency.exponentialRampToValueAtTime(28, now + 0.45);
    boomGain.gain.setValueAtTime(0.55, now);
    boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    boom.connect(boomGain);
    boomGain.connect(ctx.destination);
    boom.start(now);
    boom.stop(now + 0.5);

    // Metal crunch (bandpass noise)
    const crunchSize = ctx.sampleRate * 0.35;
    const crunchBuf = ctx.createBuffer(1, crunchSize, ctx.sampleRate);
    const crunchData = crunchBuf.getChannelData(0);
    for (let i = 0; i < crunchSize; i++) {
        crunchData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / crunchSize, 1.2);
    }
    const crunch = ctx.createBufferSource();
    crunch.buffer = crunchBuf;
    const crunchFilter = ctx.createBiquadFilter();
    crunchFilter.type = 'bandpass';
    crunchFilter.frequency.value = 900;
    crunchFilter.Q.value = 1.8;
    const crunchGain = ctx.createGain();
    crunchGain.gain.value = 0.25;
    crunch.connect(crunchFilter);
    crunchFilter.connect(crunchGain);
    crunchGain.connect(ctx.destination);
    crunch.start(now + 0.05);
    crunch.stop(now + 0.4);
}

// Lap completion chime - quick ascending two-note "ding-ding!"
export function playLapSound() {
    const ctx = getCtx();
    const now = ctx.currentTime;
    const notes = [660, 880]; // E5, A5 — bright and cheerful

    notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.2, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.3);
    });
}

// Win fanfare
export function playWinSound() {
    const ctx = getCtx();
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6

    notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.value = freq;
        gain.gain.value = 0;
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.15 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.5);
    });
}
