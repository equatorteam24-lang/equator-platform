#!/bin/bash
# Start bridge server + cloudflare tunnel
# Usage: nohup bash bridge/start.sh &

BRIDGE_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$BRIDGE_DIR/.."

export BRIDGE_PORT=3001
export BRIDGE_SECRET=uniframe-bridge-secret-change-me

# Load Supabase credentials from super-admin .env.local
SUPABASE_URL=""
SUPABASE_KEY=""
if [ -f "apps/super-admin/.env.local" ]; then
  SUPABASE_URL=$(grep '^NEXT_PUBLIC_SUPABASE_URL=' apps/super-admin/.env.local | cut -d= -f2- | tr -d '"')
  SUPABASE_KEY=$(grep '^SUPABASE_SERVICE_ROLE_KEY=' apps/super-admin/.env.local | cut -d= -f2- | tr -d '"')
fi

# Register tunnel URL in Supabase Storage so super-admin discovers it dynamically
register_tunnel_url() {
  local url="$1"
  if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
    echo "[$(date)] WARNING: No Supabase credentials, skipping URL registration"
    return
  fi
  # Try update first, then create
  local status=$(curl -s -o /dev/null -w "%{http_code}" -X PUT \
    "${SUPABASE_URL}/storage/v1/object/config/bridge-url.txt" \
    -H "apikey: ${SUPABASE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_KEY}" \
    -H "Content-Type: text/plain" \
    -d "$url")
  if [ "$status" = "200" ]; then
    echo "[$(date)] Tunnel URL registered in Supabase: $url"
  else
    # File might not exist yet, try POST (create)
    curl -s -o /dev/null -X POST \
      "${SUPABASE_URL}/storage/v1/object/config/bridge-url.txt" \
      -H "apikey: ${SUPABASE_KEY}" \
      -H "Authorization: Bearer ${SUPABASE_KEY}" \
      -H "Content-Type: text/plain" \
      -d "$url"
    echo "[$(date)] Tunnel URL created in Supabase: $url"
  fi
}

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
    register_tunnel_url "$TUNNEL_URL"
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
