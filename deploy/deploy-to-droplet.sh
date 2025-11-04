#!/usr/bin/env bash
set -euo pipefail

# Deploy helper for DigitalOcean droplet
# Usage: run on the droplet as root (or with sudo) from any directory
# It assumes git is available and SSH access is configured for the repo.

REPO_URL="$(git config --get remote.origin.url || echo '')"
APP_DIR="/var/www/adminimobiliaria"

if [ -z "$REPO_URL" ]; then
  echo "No git remote found. Please set REPO_URL in the script or run git clone manually." >&2
fi

echo "Starting deploy helper..."

mkdir -p "$APP_DIR"
cd "$APP_DIR"

if [ -d .git ]; then
  echo "Updating existing repository..."
  git fetch --all
  git reset --hard origin/main
else
  if [ -n "$REPO_URL" ]; then
    echo "Cloning repository from $REPO_URL"
    git clone "$REPO_URL" .
  else
    echo "Please git clone the repository into $APP_DIR and re-run this script." >&2
    exit 1
  fi
fi

echo "Installing Node.js dependencies..."
# Install Node 18+ if not present (best effort)
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -d. -f1 | tr -d 'v')" -lt 18 ]; then
  echo "Node 18+ not found. Please install Node 18+ on the droplet and re-run this script." >&2
  exit 1
fi

# Backend build
if [ -d backend ]; then
  echo "Building backend..."
  cd backend
  npm ci
  if npm run | grep -q build; then
    npm run build
  fi
  cd - >/dev/null
fi

# Frontend build
if [ -d frontend ]; then
  echo "Building frontend..."
  cd frontend
  npm ci
  npm run build
  # Start the frontend with a process manager or let nginx proxy to a node process
  cd - >/dev/null
fi

echo "Copying nginx config and enabling site..."
if [ -f deploy/nginx/adminimobiliaria.site.conf ]; then
  sudo cp deploy/nginx/adminimobiliaria.site.conf /etc/nginx/sites-available/adminimobiliaria.site
  sudo ln -sf /etc/nginx/sites-available/adminimobiliaria.site /etc/nginx/sites-enabled/adminimobiliaria.site
  sudo nginx -t && sudo systemctl reload nginx
else
  echo "Warning: nginx config not found at deploy/nginx/adminimobiliaria.site.conf" >&2
fi

echo "Setting up backend systemd service (example)..."
if [ -f deploy/adminimobiliaria-backend.service ]; then
  sudo cp deploy/adminimobiliaria-backend.service /etc/systemd/system/adminimobiliaria-backend.service
  sudo systemctl daemon-reload
  sudo systemctl enable --now adminimobiliaria-backend.service || true
fi

echo "Deploy helper finished. Please ensure you filled environment files and created DNS records." 
echo "Check logs: sudo journalctl -u adminimobiliaria-backend -f" 
