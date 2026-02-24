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
