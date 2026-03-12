# Uncle Gray's Cartoon Box

A dedicated cartoon watching device with a **Wii U Cafe OS-style** tile interface. Designed for an inexpensive mini PC connected to a TV — turn it on, pick a cartoon, and a random episode plays.

Best for cartoons that don't require multi-episode storyline continuity (Tom & Jerry, Looney Tunes, etc).

## How It Works

1. **Boot** — The mini PC auto-starts into a fullscreen tile grid (no desktop visible)
2. **Browse** — Each tile represents a cartoon series with poster art
3. **Select** — Click a tile (or press Enter with arrow keys / gamepad) and a random episode plays
4. **Watch** — Episode plays fullscreen via `mpv`, then returns to the grid when done

## Tech Stack

- **Electron** — Fullscreen kiosk app (the "OS" shell)
- **mpv** — Lightweight video player with hardware acceleration
- **Linux** — Minimal Debian/Ubuntu install, boots straight to the app

## Quick Start

### Development (any PC)
```bash
npm install
npm start
```

### Full Kiosk Setup (mini PC)
```bash
./scripts/setup.sh
```
This installs all dependencies, configures auto-login, and sets up boot-to-kiosk mode.

## Adding Cartoons

### Option 1: Edit config directly
Edit `config/cartoons.json`:
```json
{
  "name": "Tom & Jerry",
  "folder": "/media/cartoons/tom-and-jerry",
  "poster": "../assets/posters/tom-and-jerry.jpg"
}
```

### Option 2: Use the helper script
```bash
./scripts/add-cartoon.sh "Cartoon Name" /path/to/episodes poster.jpg
```

Then add your episode files (`.mp4`, `.mkv`, `.avi`, etc.) to the cartoon's folder.

## Project Structure

```
Uncle-Grays-Cartoon-Box/
  app/
    main.js          # Electron main process
    preload.js       # IPC bridge
    index.html       # Tile grid UI
    styles.css       # Wii U Cafe OS theme
    renderer.js      # Navigation, episode picker, playback
  config/
    cartoons.json    # Cartoon list and folder paths
  scripts/
    setup.sh         # Full mini PC kiosk setup
    add-cartoon.sh   # Quick-add a cartoon
  assets/
    posters/         # Tile artwork (jpg/png)
  media/
    cartoons/        # Episode files (not tracked by git)
```

## Controls

| Input | Action |
|---|---|
| Arrow keys | Navigate tiles |
| Enter / Space | Select cartoon |
| Gamepad D-pad | Navigate tiles |
| Gamepad A button | Select cartoon |
| Ctrl+Q | Quit (development) |

## Recommended Hardware

Any mini PC running Linux — examples:
- Beelink Mini S (Intel N95) ~$120
- Minisforum UM250 ~$180
- Raspberry Pi 5 (needs Chromium kiosk fallback)
