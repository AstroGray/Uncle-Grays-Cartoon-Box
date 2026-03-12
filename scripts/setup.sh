#!/bin/bash
# ═══════════════════════════════════════════
# Uncle Gray's Cartoon Box — Setup Script
# Run this on a fresh mini PC with Debian/Ubuntu
# ═══════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "==================================="
echo " Uncle Gray's Cartoon Box - Setup"
echo "==================================="
echo ""

# 1. Install system dependencies
echo "[1/5] Installing system dependencies..."
sudo apt-get update
sudo apt-get install -y \
  xorg \
  mpv \
  nodejs \
  npm \
  unclutter \
  --no-install-recommends

# 2. Install Node.js (if version is too old, use NodeSource)
NODE_VERSION=$(node -v 2>/dev/null | sed 's/v//' | cut -d. -f1)
if [ -z "$NODE_VERSION" ] || [ "$NODE_VERSION" -lt 18 ]; then
  echo "[2/5] Installing Node.js 20 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
else
  echo "[2/5] Node.js $NODE_VERSION is sufficient, skipping..."
fi

# 3. Install project dependencies
echo "[3/5] Installing Electron and project dependencies..."
cd "$PROJECT_DIR"
npm install

# 4. Create media directories
echo "[4/5] Creating media directories..."
sudo mkdir -p /media/cartoons
sudo chown "$USER:$USER" /media/cartoons
echo "  Place your cartoon folders in /media/cartoons/"
echo "  Example: /media/cartoons/tom-and-jerry/episode01.mp4"

# 5. Set up auto-start kiosk mode
echo "[5/5] Configuring auto-start kiosk mode..."

# Create .xinitrc for kiosk boot
cat > "$HOME/.xinitrc" << 'XINITRC'
#!/bin/sh

# Hide cursor after 3 seconds of inactivity
unclutter -idle 3 &

# Disable screen blanking and power management
xset s off
xset -dpms
xset s noblank

# Launch Uncle Gray's Cartoon Box
XINITRC

echo "cd \"$PROJECT_DIR\" && npm run kiosk" >> "$HOME/.xinitrc"
chmod +x "$HOME/.xinitrc"

# Configure auto-login and auto-startx via systemd
AUTOLOGIN_DIR="/etc/systemd/system/getty@tty1.service.d"
sudo mkdir -p "$AUTOLOGIN_DIR"
sudo tee "$AUTOLOGIN_DIR/override.conf" > /dev/null << EOF
[Service]
ExecStart=
ExecStart=-/sbin/agetty --autologin $USER --noclear %I \$TERM
EOF

# Add startx to bash profile if not already there
PROFILE_LINE='[ -z "$DISPLAY" ] && [ "$(tty)" = "/dev/tty1" ] && exec startx'
if ! grep -qF "$PROFILE_LINE" "$HOME/.bash_profile" 2>/dev/null; then
  echo "$PROFILE_LINE" >> "$HOME/.bash_profile"
fi

echo ""
echo "==================================="
echo " Setup Complete!"
echo "==================================="
echo ""
echo "Next steps:"
echo "  1. Add poster images to: $PROJECT_DIR/assets/posters/"
echo "  2. Add cartoon episodes to: /media/cartoons/<cartoon-name>/"
echo "  3. Edit config/cartoons.json to match your collection"
echo "  4. Test with: cd $PROJECT_DIR && npm start"
echo "  5. Reboot to enter kiosk mode automatically"
echo ""
