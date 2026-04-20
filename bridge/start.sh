#!/bin/bash
# Start bridge server + cloudflare tunnel
# Usage: nohup bash bridge/start.sh &

BRIDGE_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$BRIDGE_DIR/.."

export BRIDGE_PORT=3001
export BRIDGE_SECRET=equator-bridge-secret-change-me

# Kill old processes
pkill -f "node.*bridge/server.js" 2>/dev/null
pkill -f "cloudflared.*tunnel.*3001" 2>/dev/null
sleep 1

# Start bridge server with auto-restart
while true; do
  echo "[$(date)] Starting bridge server..."
  node bridge/server.js >> bridge/server.log 2>&1
  echo "[$(date)] Bridge crashed, restarting in 3s..."
  sleep 3
done &
BRIDGE_PID=$!

# Wait for bridge to be ready
sleep 2

# Start cloudflare tunnel with auto-restart
while true; do
  echo "[$(date)] Starting cloudflare tunnel..."
  TUNNEL_URL=$(/home/alexa/.local/bin/cloudflared tunnel --url http://localhost:3001 --no-autoupdate 2>&1 | tee -a bridge/tunnel.log | grep -o 'https://[^ ]*\.trycloudflare\.com' | head -1)
  if [ -n "$TUNNEL_URL" ]; then
    echo "[$(date)] Tunnel URL: $TUNNEL_URL"
    echo "$TUNNEL_URL" > bridge/tunnel-url.txt
  fi
  # cloudflared exited
  echo "[$(date)] Tunnel crashed, restarting in 5s..."
  sleep 5
done &
TUNNEL_PID=$!

echo "Bridge PID: $BRIDGE_PID, Tunnel PID: $TUNNEL_PID"
echo "Bridge log: bridge/server.log"
echo "Tunnel log: bridge/tunnel.log"
echo "Tunnel URL: bridge/tunnel-url.txt"

wait
