#!/bin/bash
set -euo pipefail

log() { echo "[init] $*"; }

# 1. Install workspace dependencies if lockfile exists but node_modules doesn't
if [ -d /workspace ] && [ ! -d /workspace/node_modules ]; then
  if [ -f /workspace/pnpm-lock.yaml ] && command -v pnpm &>/dev/null; then
    log "Installing dependencies (pnpm)..."
    cd /workspace && pnpm install --frozen-lockfile
  elif [ -f /workspace/yarn.lock ] && command -v yarn &>/dev/null; then
    log "Installing dependencies (yarn)..."
    cd /workspace && yarn install --frozen-lockfile
  elif [ -f /workspace/package-lock.json ] && command -v npm &>/dev/null; then
    log "Installing dependencies (npm)..."
    cd /workspace && npm ci
  fi
fi

# 2. Run user init script if present
if [ -x /workspace/.claudestrator/init.sh ]; then
  log "Running user init script..."
  /workspace/.claudestrator/init.sh
elif [ -f /workspace/.claudestrator/init.sh ]; then
  log "Running user init script..."
  bash /workspace/.claudestrator/init.sh
fi

# 3. Hand off to worker
log "Starting worker..."
exec node /app/dist/worker.js "$@"
