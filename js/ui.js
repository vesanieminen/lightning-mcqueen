import { CAR_DATA } from './cars.js';
import { TRACK_DATA } from './tracks.js';

const overlay = document.getElementById('ui-overlay');

// ──────────────── Gamepad / keyboard menu navigation ────────────────

let _menuPollId = null;
let _menuItems = [];      // array of DOM elements
let _menuIndex = 0;       // currently highlighted item
let _menuConfirm = null;  // callback when A / Enter pressed
let _lastDPad = { up: false, down: false, left: false, right: false };
let _lastA = false;
let _menuColumns = 1;     // grid columns for 2-D navigation
let _clickOnNav = false;  // whether navigating clicks items (grids) vs just highlighting (buttons)

function startMenuPoll() {
    stopMenuPoll();
    _lastDPad = { up: false, down: false, left: false, right: false };
    _lastA = false;
    _menuPollId = setInterval(pollMenuGamepad, 100);
}

function stopMenuPoll() {
    if (_menuPollId !== null) {
        clearInterval(_menuPollId);
        _menuPollId = null;
    }
    window.removeEventListener('keydown', onMenuKeyDown);
}

function setMenuItems(selector, columns = 1, confirmCb = null, clickOnNav = false) {
    _menuItems = Array.from(overlay.querySelectorAll(selector));
    _menuColumns = columns;
    _menuIndex = _menuItems.findIndex(el => el.classList.contains('selected'));
    if (_menuIndex < 0) _menuIndex = 0;
    _menuConfirm = confirmCb;
    _clickOnNav = clickOnNav;
    highlightMenuItem();
    window.removeEventListener('keydown', onMenuKeyDown);
    window.addEventListener('keydown', onMenuKeyDown);
    startMenuPoll();
}

function highlightMenuItem() {
    _menuItems.forEach((el, i) => {
        el.classList.toggle('gp-focus', i === _menuIndex);
    });
    if (_menuItems[_menuIndex]) {
        _menuItems[_menuIndex].scrollIntoView({ block: 'nearest' });
    }
}

function onMenuKeyDown(e) {
    if (!_menuItems.length) return;
    let handled = true;
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        moveMenuSelection(-_menuColumns);
    } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        moveMenuSelection(_menuColumns);
    } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        moveMenuSelection(-1);
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        moveMenuSelection(1);
    } else if (e.key === 'Enter' || e.key === ' ') {
        activateMenuItem();
    } else {
        handled = false;
    }
    if (handled) e.preventDefault();
}

function moveMenuSelection(delta) {
    if (!_menuItems.length) return;
    _menuIndex = (_menuIndex + delta + _menuItems.length) % _menuItems.length;
    highlightMenuItem();
    // Only click on navigation for grids (to update selection state), not for action buttons
    if (_clickOnNav) _menuItems[_menuIndex].click();
}

function activateMenuItem() {
    if (_menuConfirm) _menuConfirm();
}

function pollMenuGamepad() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    let gp = null;
    for (const g of gamepads) {
        if (g) { gp = g; break; }
    }
    if (!gp) return;

    const deadzone = 0.5;
    const stickY = gp.axes[1] || 0;
    const stickX = gp.axes[0] || 0;

    // D-pad buttons (standard mapping)
    const up    = (gp.buttons[12] && gp.buttons[12].pressed) || stickY < -deadzone;
    const down  = (gp.buttons[13] && gp.buttons[13].pressed) || stickY > deadzone;
    const left  = (gp.buttons[14] && gp.buttons[14].pressed) || stickX < -deadzone;
    const right = (gp.buttons[15] && gp.buttons[15].pressed) || stickX > deadzone;

    // Edge detection
    if (up && !_lastDPad.up)    moveMenuSelection(-_menuColumns);
    if (down && !_lastDPad.down) moveMenuSelection(_menuColumns);
    if (left && !_lastDPad.left) moveMenuSelection(-1);
    if (right && !_lastDPad.right) moveMenuSelection(1);

    _lastDPad = { up, down, left, right };

    // A button (button 0) for confirm
    const aBtn = gp.buttons[0] && gp.buttons[0].pressed;
    if (aBtn && !_lastA) activateMenuItem();
    _lastA = aBtn;
}

// ──────────────── Car preview drawing ────────────────

function drawCarPreview(canvas, carData) {
    const w = canvas.width = 160;
    const h = canvas.height = 100;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);

    const bodyColor = '#' + (carData.bodyColor).toString(16).padStart(6, '0');
    const accentColor = '#' + (carData.accentColor).toString(16).padStart(6, '0');
    const eyeColor = '#' + (carData.eyeColor).toString(16).padStart(6, '0');

    // Shadow under car
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(w / 2, h - 12, 60, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Main body (lower, wide)
    ctx.fillStyle = bodyColor;
    roundRect(ctx, 20, 38, 120, 32, 8);
    ctx.fill();

    // Cabin / roof (upper, narrower)
    ctx.fillStyle = bodyColor;
    roundRect(ctx, 55, 18, 62, 24, 6);
    ctx.fill();

    // Windshield
    ctx.fillStyle = 'rgba(170,220,255,0.5)';
    ctx.beginPath();
    ctx.moveTo(55, 22);
    ctx.lineTo(47, 40);
    ctx.lineTo(70, 40);
    ctx.lineTo(60, 22);
    ctx.closePath();
    ctx.fill();

    // Rear window
    ctx.beginPath();
    ctx.moveTo(117, 22);
    ctx.lineTo(112, 40);
    ctx.lineTo(125, 40);
    ctx.lineTo(117, 22);
    ctx.closePath();
    ctx.fill();

    // Eyes on windshield (Cars movie style!)
    // Left eye
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.ellipse(53, 32, 7, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = eyeColor;
    ctx.beginPath();
    ctx.ellipse(54, 33, 4, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.ellipse(54.5, 33, 2.5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    // Eye highlight
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.ellipse(56, 31, 1.5, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Right eye
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.ellipse(67, 32, 7, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = eyeColor;
    ctx.beginPath();
    ctx.ellipse(68, 33, 4, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.ellipse(68.5, 33, 2.5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.ellipse(70, 31, 1.5, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Smile / bumper
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(30, 58, 8, -0.6, 0.6);
    ctx.stroke();

    // Accent stripe along body side
    ctx.fillStyle = accentColor;
    ctx.fillRect(30, 50, 100, 4);

    // Number on side
    if (carData.number) {
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial Black, Impact, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // text shadow
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillText(carData.number, 101, 49);
        ctx.fillStyle = 'white';
        ctx.fillText(carData.number, 100, 48);
    }

    // Wheels
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.ellipse(42, 72, 12, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(118, 72, 12, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hubcaps
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.ellipse(42, 72, 5, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(118, 72, 5, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Headlight
    ctx.fillStyle = '#ffffcc';
    ctx.beginPath();
    ctx.ellipse(23, 48, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Taillight
    ctx.fillStyle = '#ff3333';
    ctx.beginPath();
    ctx.ellipse(137, 48, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

// ──────────────── Screens ────────────────

// Show title screen
export function showTitleScreen(onPlay) {
    overlay.innerHTML = `
        <div class="title-screen">
            <h1>LIGHTNING<br>McQUEEN</h1>
            <div class="subtitle">RACING!</div>
            <button class="play-btn menu-item" id="play-btn">PLAY!</button>
        </div>
    `;
    document.getElementById('play-btn').addEventListener('click', onPlay);
    setMenuItems('.menu-item', 1, () => {
        document.getElementById('play-btn').click();
    });
}

// Show character select
export function showCharacterSelect(onSelect) {
    let selectedId = 'mcqueen';

    const renderCards = () => {
        const grid = overlay.querySelector('.car-grid');
        if (!grid) return;
        grid.innerHTML = CAR_DATA.map(car => `
            <div class="car-card menu-item ${car.id === selectedId ? 'selected' : ''}" data-car-id="${car.id}">
                <canvas class="car-preview-canvas" data-car-id="${car.id}"></canvas>
                <div class="car-name">${car.name}</div>
            </div>
        `).join('');

        // Draw car previews on canvases
        grid.querySelectorAll('.car-preview-canvas').forEach(canvas => {
            const carId = canvas.dataset.carId;
            const car = CAR_DATA.find(c => c.id === carId);
            if (car) drawCarPreview(canvas, car);
        });

        grid.querySelectorAll('.car-card').forEach(card => {
            card.addEventListener('click', () => {
                selectedId = card.dataset.carId;
                // Update selected styling without full re-render
                grid.querySelectorAll('.car-card').forEach(c => c.classList.toggle('selected', c.dataset.carId === selectedId));
            });
        });

        const btn = overlay.querySelector('.confirm-btn');
        if (btn) btn.disabled = !selectedId;
    };

    overlay.innerHTML = `
        <div class="select-screen">
            <h2>CHOOSE YOUR CAR!</h2>
            <div class="car-grid"></div>
            <button class="confirm-btn" id="confirm-car">RACE!</button>
        </div>
    `;

    renderCards();

    document.getElementById('confirm-car').addEventListener('click', () => {
        if (selectedId) {
            stopMenuPoll();
            onSelect(selectedId);
        }
    });

    setMenuItems('.car-card.menu-item', 3, () => {
        document.getElementById('confirm-car').click();
    }, true);
}

// Show track select
export function showTrackSelect(onSelect) {
    let selectedId = 'oval';

    const renderCards = () => {
        const grid = overlay.querySelector('.track-grid');
        if (!grid) return;
        grid.innerHTML = TRACK_DATA.map(track => `
            <div class="track-card menu-item ${track.id === selectedId ? 'selected' : ''}" data-track-id="${track.id}">
                <div class="track-icon">${track.icon}</div>
                <div class="track-name">${track.name}</div>
            </div>
        `).join('');

        grid.querySelectorAll('.track-card').forEach(card => {
            card.addEventListener('click', () => {
                selectedId = card.dataset.trackId;
                grid.querySelectorAll('.track-card').forEach(c => c.classList.toggle('selected', c.dataset.trackId === selectedId));
            });
        });
    };

    overlay.innerHTML = `
        <div class="select-screen">
            <h2>CHOOSE A TRACK!</h2>
            <div class="track-grid"></div>
            <button class="confirm-btn" id="confirm-track">GO!</button>
        </div>
    `;

    renderCards();

    document.getElementById('confirm-track').addEventListener('click', () => {
        if (selectedId) {
            stopMenuPoll();
            onSelect(selectedId);
        }
    });

    setMenuItems('.track-card.menu-item', 2, () => {
        document.getElementById('confirm-track').click();
    }, true);
}

// Show race HUD
export function showRaceHUD() {
    stopMenuPoll();
    overlay.innerHTML = `
        <div class="race-hud">
            <div class="hud-lap" id="hud-lap">Lap 1 / 3</div>
            <div class="hud-position" id="hud-position">1st</div>
        </div>
        <div class="mobile-controls">
            <div class="steer-btn" id="steer-left">&#9664;</div>
            <div class="steer-btn" id="steer-right">&#9654;</div>
        </div>
    `;
}

// Show countdown
export function showCountdown(number) {
    let existing = document.getElementById('countdown-text');
    if (existing) existing.remove();

    const el = document.createElement('div');
    el.id = 'countdown-text';
    el.className = 'hud-countdown' + (number === 'GO!' ? ' hud-go' : '');
    el.textContent = number;
    overlay.appendChild(el);

    setTimeout(() => el.remove(), 800);
}

// Update HUD during race
export function updateHUD(lap, totalLaps, position, totalCars) {
    const lapEl = document.getElementById('hud-lap');
    const posEl = document.getElementById('hud-position');
    if (lapEl) lapEl.textContent = `Lap ${Math.min(lap + 1, totalLaps)} / ${totalLaps}`;
    if (posEl) posEl.textContent = getPositionText(position);
}

// Show results screen
export function showResults(results, playerCarId, onPlayAgain) {
    const playerResult = results.find(r => r.carId === playerCarId);
    const playerPos = results.indexOf(playerResult) + 1;
    const isWinner = playerPos === 1;

    overlay.innerHTML = `
        <div class="results-screen">
            <h2 class="${isWinner ? 'winner-text' : ''}">${isWinner ? 'YOU WIN!' : getPositionText(playerPos) + ' PLACE!'}</h2>
            ${isWinner ? '<div class="position-text">Ka-chow! &#9889;</div>' : '<div class="position-text">Great race!</div>'}
            <ul class="results-list">
                ${results.map((r, i) => {
                    const car = CAR_DATA.find(c => c.id === r.carId);
                    return `<li>
                        <span class="result-pos">${getPositionText(i + 1)}</span>
                        <canvas class="result-car-canvas" data-car-id="${r.carId}" width="80" height="50"></canvas>
                        <span>${car.name}${r.carId === playerCarId ? ' (YOU)' : ''}</span>
                    </li>`;
                }).join('')}
            </ul>
            <button class="play-btn menu-item" id="play-again-btn">PLAY AGAIN!</button>
        </div>
    `;

    // Draw mini car previews in results
    overlay.querySelectorAll('.result-car-canvas').forEach(canvas => {
        const carId = canvas.dataset.carId;
        const car = CAR_DATA.find(c => c.id === carId);
        if (car) drawCarPreviewMini(canvas, car);
    });

    document.getElementById('play-again-btn').addEventListener('click', () => {
        stopMenuPoll();
        onPlayAgain();
    });

    setMenuItems('.menu-item', 1, () => {
        document.getElementById('play-again-btn').click();
    });
}

// Mini car preview for results list (smaller, simpler)
function drawCarPreviewMini(canvas, carData) {
    const w = canvas.width;
    const h = canvas.height;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);

    const bodyColor = '#' + (carData.bodyColor).toString(16).padStart(6, '0');
    const accentColor = '#' + (carData.accentColor).toString(16).padStart(6, '0');
    const eyeColor = '#' + (carData.eyeColor).toString(16).padStart(6, '0');

    // Body
    ctx.fillStyle = bodyColor;
    roundRect(ctx, 8, 16, 64, 18, 5);
    ctx.fill();

    // Cabin
    ctx.fillStyle = bodyColor;
    roundRect(ctx, 26, 6, 32, 13, 4);
    ctx.fill();

    // Eyes
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.ellipse(28, 14, 4, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(36, 14, 4, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.ellipse(29, 14.5, 2, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(37, 14.5, 2, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Stripe
    ctx.fillStyle = accentColor;
    ctx.fillRect(14, 27, 52, 2);

    // Wheels
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.ellipse(22, 38, 7, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(58, 38, 7, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hubcaps
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.ellipse(22, 38, 3, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(58, 38, 3, 3, 0, 0, Math.PI * 2);
    ctx.fill();
}

// ──────────────── Pause menu ────────────────

export function showPauseMenu(onResume, onQuit) {
    // Don't add duplicates
    if (document.getElementById('pause-overlay')) return;

    const pauseEl = document.createElement('div');
    pauseEl.id = 'pause-overlay';
    pauseEl.className = 'pause-overlay';
    pauseEl.innerHTML = `
        <div class="pause-box">
            <h2>PAUSED</h2>
            <button class="pause-btn menu-item selected" id="pause-resume">RESUME</button>
            <button class="pause-btn menu-item" id="pause-quit">QUIT</button>
        </div>
    `;
    overlay.appendChild(pauseEl);

    document.getElementById('pause-resume').addEventListener('click', () => {
        stopMenuPoll();
        onResume();
    });
    document.getElementById('pause-quit').addEventListener('click', () => {
        stopMenuPoll();
        onQuit();
    });

    setMenuItems('#pause-overlay .menu-item', 1, () => {
        // Confirm whichever is focused
        const items = overlay.querySelectorAll('#pause-overlay .menu-item');
        items[_menuIndex]?.click();
    });
}

export function hidePauseMenu() {
    stopMenuPoll();
    const el = document.getElementById('pause-overlay');
    if (el) el.remove();
}

// Clear UI
export function clearUI() {
    stopMenuPoll();
    overlay.innerHTML = '';
}

// ──────────────── Helpers ────────────────

function getPositionText(pos) {
    const suffixes = ['st', 'nd', 'rd'];
    const suffix = pos <= 3 ? suffixes[pos - 1] : 'th';
    return `${pos}${suffix}`;
}

function colorToCSS(hex) {
    return `#${hex.toString(16).padStart(6, '0')}`;
}
