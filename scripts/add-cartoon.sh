#!/bin/bash
# ═══════════════════════════════════════════
# Quick helper to add a new cartoon to the box
# Usage: ./add-cartoon.sh "Cartoon Name" /path/to/episodes [poster.jpg]
# ═══════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CONFIG="$PROJECT_DIR/config/cartoons.json"

if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Usage: $0 \"Cartoon Name\" /path/to/episodes [poster.jpg]"
  echo ""
  echo "Examples:"
  echo "  $0 \"Tom & Jerry\" /media/cartoons/tom-and-jerry"
  echo "  $0 \"Looney Tunes\" /media/cartoons/looney-tunes poster.jpg"
  exit 1
fi

NAME="$1"
FOLDER="$2"
POSTER="$3"

# Create the episode folder if it doesn't exist
if [ ! -d "$FOLDER" ]; then
  echo "Creating folder: $FOLDER"
  mkdir -p "$FOLDER"
fi

# Copy poster if provided
POSTER_REL=""
if [ -n "$POSTER" ] && [ -f "$POSTER" ]; then
  SLUG=$(echo "$NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd 'a-z0-9-')
  EXT="${POSTER##*.}"
  cp "$POSTER" "$PROJECT_DIR/assets/posters/${SLUG}.${EXT}"
  POSTER_REL="../assets/posters/${SLUG}.${EXT}"
  echo "Poster copied to assets/posters/${SLUG}.${EXT}"
fi

# Add entry to cartoons.json using Node.js for safe JSON manipulation
node -e "
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('$CONFIG', 'utf-8'));
config.push({
  name: $(printf '%s' "$NAME" | node -e "process.stdout.write(JSON.stringify(require('fs').readFileSync('/dev/stdin','utf-8')))"),
  folder: '$FOLDER',
  poster: '$POSTER_REL' || null
});
fs.writeFileSync('$CONFIG', JSON.stringify(config, null, 2) + '\n');
"

echo "Added \"$NAME\" to cartoons.json"
echo "  Folder: $FOLDER"
[ -n "$POSTER_REL" ] && echo "  Poster: $POSTER_REL"
echo ""
echo "Don't forget to add episode files to: $FOLDER"
