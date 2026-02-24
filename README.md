# Lightning McQueen Racing

A 3D browser-based racing game featuring Lightning McQueen and characters from the Cars movies. Built with Three.js, designed for young kids (4+) with simple steering-only controls.

## How to Play

1. **Start a local server** (required for ES modules):
   ```
   python3 -m http.server 8080
   ```
2. Open `http://localhost:8080` in your browser
3. Click **PLAY!**, choose a car, pick a track, and race!

### Controls

| Input | Action |
|-------|--------|
| Arrow Left / A | Steer left |
| Arrow Right / D | Steer right |
| Gamepad left stick / D-pad | Steer |
| Mobile touch buttons | Steer |

The car accelerates automatically - just steer!

## Characters

- **Lightning McQueen** - Red #95, the fastest car
- **Mater** - Brown tow truck
- **Sally** - Light blue Porsche
- **Cruz Ramirez** - Yellow #51
- **Jackson Storm** - Dark gray #20
- **Sheriff** - Black & white police car

## Tracks

- **Radiator Springs Oval** - Desert oval with buttes and cacti (3 laps)
- **Piston Cup Circuit** - Rounded rectangle stadium circuit (3 laps)

## Features

- 3D graphics with Three.js (shadows, scenery, sky)
- 6 playable characters with Cars-movie-style eyes
- 5 AI opponents per race (easy to beat)
- Physics-based car-to-car collisions
- Gamepad, keyboard, and touch support
- Sound effects (engine, countdown, win fanfare) via Web Audio API
- Red/white curb strips, dashed center line, start/finish line

## Tech Stack

- **Three.js** (v0.170.0) via CDN import map
- Pure HTML / CSS / JavaScript - no build tools required
- Web Audio API for procedural sounds
- Gamepad API for controller support

## Project Structure

```
index.html          - Entry point with Three.js import map
css/style.css       - UI styling (menus, HUD, mobile controls)
js/main.js          - Game loop, state machine, scene setup
js/cars.js          - Car character data and 3D model builder
js/tracks.js        - Track paths, road mesh, scenery
js/racing.js        - Car physics, controls, camera, collisions
js/ai.js            - AI driver behavior
js/ui.js            - Menu screens, HUD, results
js/sounds.js        - Web Audio procedural sounds
```
