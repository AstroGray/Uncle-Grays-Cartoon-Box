/* ═══════════════════════════════════════════
   Uncle Gray's Cartoon Box — Renderer
   Handles tile grid, navigation, and playback
   ═══════════════════════════════════════════ */

(function () {
  'use strict';

  const grid = document.getElementById('tile-grid');
  const loadingOverlay = document.getElementById('loading-overlay');
  const settingsOverlay = document.getElementById('settings-overlay');
  const settingsClose = document.getElementById('settings-close');
  const greetingEl = document.getElementById('greeting');
  const clockEl = document.getElementById('clock');

  let cartoons = [];
  let focusIndex = 0;
  let tiles = [];
  let isPlaying = false;
  let columns = 4;

  const noPosterColors = [
    'linear-gradient(135deg, #ff6b6b, #ee5a24)',
    'linear-gradient(135deg, #ffa502, #f0932b)',
    'linear-gradient(135deg, #7bed9f, #26de81)',
    'linear-gradient(135deg, #70a1ff, #3867d6)',
    'linear-gradient(135deg, #a29bfe, #6c5ce7)',
    'linear-gradient(135deg, #fd79a8, #e84393)',
  ];

  // ─── Clock ───
  function updateClock() {
    const now = new Date();
    const h = now.getHours();
    const m = String(now.getMinutes()).padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    clockEl.textContent = `${hour12}:${m} ${ampm}`;
  }

  function updateGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) greetingEl.textContent = 'Good Morning!';
    else if (hour < 17) greetingEl.textContent = 'Good Afternoon!';
    else greetingEl.textContent = 'Good Evening!';
  }

  updateClock();
  updateGreeting();
  setInterval(updateClock, 10000);

  // ─── Bubble Background ───
  function createBubbles() {
    const container = document.getElementById('bubbles');
    if (!container) return;
    const bubbleColors = [
      'rgba(214, 224, 216, 0.8)',
      'rgba(230, 239, 236, 0.8)',
      'rgba(255, 255, 255, 0.8)',
      'rgba(232, 243, 229, 0.8)',
    ];
    for (let i = 0; i < 14; i++) {
      const b = document.createElement('div');
      b.className = 'bubble';
      const color = bubbleColors[Math.floor(Math.random() * bubbleColors.length)];
      b.style.background = `radial-gradient(circle at 35% 35%, ${color}, rgba(255,255,255,0.05))`;
      const size = (18 + Math.random() * 72) * 10;
      b.style.width = size + 'px';
      b.style.height = size + 'px';
      b.style.left = (-20 + Math.random() * 120) + '%';
      b.style.top  = (-20 + Math.random() * 120) + '%';
      b.style.animationDuration = (100 + Math.random() * 160) + 's';
      b.style.animationDelay = (-Math.random() * 260) + 's';
      b.style.opacity = (0.04 + Math.random() * 0.13);
      container.appendChild(b);
    }
  }

  // ─── Build Tile Grid ───
  async function init() {
    cartoons = await window.cartoonBox.loadCartoons();

    cartoons.forEach((cartoon, index) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'tile-wrapper';
      wrapper.dataset.index = index;
      wrapper.setAttribute('role', 'button');
      wrapper.setAttribute('aria-label', cartoon.name);

      const tile = document.createElement('div');
      tile.className = 'tile';

      if (cartoon.poster) {
        const img = document.createElement('img');
        img.className = 'tile-poster';
        img.src = cartoon.poster;
        img.alt = cartoon.name;
        img.draggable = false;
        img.onerror = function () {
          this.remove();
          tile.classList.add('no-poster');
          tile.style.background = noPosterColors[index % noPosterColors.length];
        };
        tile.appendChild(img);
      } else {
        tile.classList.add('no-poster');
        tile.style.background = noPosterColors[index % noPosterColors.length];
      }

      const label = document.createElement('div');
      label.className = 'tile-label';
      label.textContent = cartoon.name;

      const playBar = document.createElement('div');
      playBar.className = 'tile-play-bar';
      playBar.textContent = 'Play';

      const frame = document.createElement('div');
      frame.className = 'tile-frame';
      frame.appendChild(tile);
      frame.appendChild(playBar);
      wrapper.appendChild(frame);
      wrapper.appendChild(label);
      wrapper.addEventListener('click', () => onTileSelect(index));
      grid.appendChild(wrapper);
    });

    // Settings tile
    const settingsWrapper = document.createElement('div');
    settingsWrapper.className = 'tile-wrapper';
    settingsWrapper.dataset.index = cartoons.length;
    settingsWrapper.setAttribute('role', 'button');
    settingsWrapper.setAttribute('aria-label', 'Settings');

    const settingsTile = document.createElement('div');
    settingsTile.className = 'tile settings-tile';
    settingsTile.innerHTML = '<div class="tile-icon">&#9881;</div>';

    const settingsLabel = document.createElement('div');
    settingsLabel.className = 'tile-label';
    settingsLabel.textContent = 'Settings';

    const settingsPlayBar = document.createElement('div');
    settingsPlayBar.className = 'tile-play-bar';
    settingsPlayBar.textContent = 'Open';

    const settingsFrame = document.createElement('div');
    settingsFrame.className = 'tile-frame';
    settingsFrame.appendChild(settingsTile);
    settingsFrame.appendChild(settingsPlayBar);
    settingsWrapper.appendChild(settingsFrame);
    settingsWrapper.appendChild(settingsLabel);
    settingsWrapper.addEventListener('click', () => openSettings());
    grid.appendChild(settingsWrapper);

    tiles = Array.from(grid.querySelectorAll('.tile-wrapper'));
    updateColumns();
    setFocus(0);
  }

  // ─── Tile Selection — Pick Random Episode ───
  async function onTileSelect(index) {
    if (isPlaying || index >= cartoons.length) return;

    const cartoon = cartoons[index];
    isPlaying = true;
    loadingOverlay.classList.remove('hidden');

    try {
      const episodes = await window.cartoonBox.listEpisodes(cartoon.folder);

      if (episodes.length === 0) {
        alert(`No episodes found for "${cartoon.name}".\n\nAdd video files to:\n${cartoon.folder}`);
        loadingOverlay.classList.add('hidden');
        isPlaying = false;
        return;
      }

      const randomEp = episodes[Math.floor(Math.random() * episodes.length)];
      loadingOverlay.classList.add('hidden');

      await window.cartoonBox.playVideo(randomEp);
    } catch (err) {
      console.error('Playback error:', err);
      alert('Failed to play episode. Is mpv installed?');
      loadingOverlay.classList.add('hidden');
    }

    isPlaying = false;
  }

  // ─── Settings ───
  function openSettings() {
    settingsOverlay.classList.remove('hidden');
  }

  settingsClose.addEventListener('click', () => {
    settingsOverlay.classList.add('hidden');
  });

  // ─── Keyboard / D-pad Navigation ───
  function updateColumns() {
    if (tiles.length === 0) return;
    const gridStyle = getComputedStyle(grid);
    columns = gridStyle.gridTemplateColumns.split(' ').length;
  }

  function setFocus(index) {
    if (index < 0 || index >= tiles.length) return;
    tiles.forEach(t => t.classList.remove('focused'));
    focusIndex = index;
    tiles[focusIndex].classList.add('focused');
    tiles[focusIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  window.addEventListener('resize', updateColumns);

  document.addEventListener('keydown', (e) => {
    if (settingsOverlay && !settingsOverlay.classList.contains('hidden')) {
      if (e.key === 'Escape' || e.key === 'Backspace') {
        settingsOverlay.classList.add('hidden');
      }
      return;
    }

    switch (e.key) {
      case 'ArrowRight':
        setFocus(Math.min(focusIndex + 1, tiles.length - 1));
        break;
      case 'ArrowLeft':
        setFocus(Math.max(focusIndex - 1, 0));
        break;
      case 'ArrowDown':
        setFocus(Math.min(focusIndex + columns, tiles.length - 1));
        break;
      case 'ArrowUp':
        setFocus(Math.max(focusIndex - columns, 0));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        tiles[focusIndex].click();
        break;
      case 'Escape':
      case 'Backspace':
        break;
    }
  });

  // ─── Gamepad Support (TV remotes, controllers) ───
  let gamepadPollInterval = null;
  let lastGamepadInput = 0;
  const GAMEPAD_DEBOUNCE = 200;

  function pollGamepad() {
    const gamepads = navigator.getGamepads();
    const now = Date.now();

    for (const gp of gamepads) {
      if (!gp) continue;
      if (now - lastGamepadInput < GAMEPAD_DEBOUNCE) continue;

      const axisX = gp.axes[0] || 0;
      const axisY = gp.axes[1] || 0;
      const threshold = 0.5;

      if (axisX > threshold || gp.buttons[15]?.pressed) {
        setFocus(Math.min(focusIndex + 1, tiles.length - 1));
        lastGamepadInput = now;
      } else if (axisX < -threshold || gp.buttons[14]?.pressed) {
        setFocus(Math.max(focusIndex - 1, 0));
        lastGamepadInput = now;
      } else if (axisY > threshold || gp.buttons[13]?.pressed) {
        setFocus(Math.min(focusIndex + columns, tiles.length - 1));
        lastGamepadInput = now;
      } else if (axisY < -threshold || gp.buttons[12]?.pressed) {
        setFocus(Math.max(focusIndex - columns, 0));
        lastGamepadInput = now;
      }

      if (gp.buttons[0]?.pressed) {
        tiles[focusIndex].click();
        lastGamepadInput = now;
      }

      if (gp.buttons[1]?.pressed) {
        if (!settingsOverlay.classList.contains('hidden')) {
          settingsOverlay.classList.add('hidden');
        }
        lastGamepadInput = now;
      }
    }
  }

  window.addEventListener('gamepadconnected', () => {
    if (!gamepadPollInterval) {
      gamepadPollInterval = setInterval(pollGamepad, 50);
    }
  });

  window.addEventListener('gamepaddisconnected', () => {
    const gamepads = navigator.getGamepads();
    const anyConnected = Array.from(gamepads).some(gp => gp !== null);
    if (!anyConnected && gamepadPollInterval) {
      clearInterval(gamepadPollInterval);
      gamepadPollInterval = null;
    }
  });

  // ─── Boot ───
  createBubbles();
  init();
})();
