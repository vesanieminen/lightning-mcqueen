import { CAR_DATA } from './cars.js';
import { TRACK_DATA } from './tracks.js';

const overlay = document.getElementById('ui-overlay');

// Show title screen
export function showTitleScreen(onPlay) {
    overlay.innerHTML = `
        <div class="title-screen">
            <h1>LIGHTNING<br>McQUEEN</h1>
            <div class="subtitle">RACING!</div>
            <button class="play-btn" id="play-btn">PLAY!</button>
        </div>
    `;
    document.getElementById('play-btn').addEventListener('click', onPlay);
}

// Show character select
export function showCharacterSelect(onSelect) {
    let selectedId = 'mcqueen'; // default selection

    const renderCards = () => {
        const grid = overlay.querySelector('.car-grid');
        if (!grid) return;
        grid.innerHTML = CAR_DATA.map(car => `
            <div class="car-card ${car.id === selectedId ? 'selected' : ''}" data-car-id="${car.id}">
                <div class="car-preview" style="background: ${colorToCSS(car.bodyColor)}; border: 2px solid ${colorToCSS(car.accentColor)};"></div>
                <div class="car-name">${car.name}</div>
            </div>
        `).join('');

        grid.querySelectorAll('.car-card').forEach(card => {
            card.addEventListener('click', () => {
                selectedId = card.dataset.carId;
                renderCards();
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
        if (selectedId) onSelect(selectedId);
    });
}

// Show track select
export function showTrackSelect(onSelect) {
    let selectedId = 'oval';

    const renderCards = () => {
        const grid = overlay.querySelector('.track-grid');
        if (!grid) return;
        grid.innerHTML = TRACK_DATA.map(track => `
            <div class="track-card ${track.id === selectedId ? 'selected' : ''}" data-track-id="${track.id}">
                <div class="track-icon">${track.icon}</div>
                <div class="track-name">${track.name}</div>
            </div>
        `).join('');

        grid.querySelectorAll('.track-card').forEach(card => {
            card.addEventListener('click', () => {
                selectedId = card.dataset.trackId;
                renderCards();
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
        if (selectedId) onSelect(selectedId);
    });
}

// Show race HUD
export function showRaceHUD() {
    overlay.innerHTML = `
        <div class="race-hud">
            <div class="hud-lap" id="hud-lap">Lap 1 / 3</div>
            <div class="hud-position" id="hud-position">1st</div>
        </div>
        <div class="controls-hint">Arrow Keys or A/D to steer</div>
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

    // Auto-remove after animation
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
                        <span class="result-color" style="background: ${colorToCSS(car.bodyColor)}"></span>
                        <span>${car.name}${r.carId === playerCarId ? ' (YOU)' : ''}</span>
                    </li>`;
                }).join('')}
            </ul>
            <button class="play-btn" id="play-again-btn">PLAY AGAIN!</button>
        </div>
    `;

    document.getElementById('play-again-btn').addEventListener('click', onPlayAgain);
}

// Clear UI
export function clearUI() {
    overlay.innerHTML = '';
}

// Helpers
function getPositionText(pos) {
    const suffixes = ['st', 'nd', 'rd'];
    const suffix = pos <= 3 ? suffixes[pos - 1] : 'th';
    return `${pos}${suffix}`;
}

function colorToCSS(hex) {
    return `#${hex.toString(16).padStart(6, '0')}`;
}
