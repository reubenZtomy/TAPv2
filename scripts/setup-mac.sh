#!/usr/bin/env bash
# One-time setup + start TAP V2 (macOS / Linux). Run from repo root:
#   chmod +x scripts/setup-mac.sh
#   ./scripts/setup-mac.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ADMIN_EMAIL="admin@tap.local"
ADMIN_PASSWORD="TAPadmin2026"
FRONTEND_URL="http://localhost:5173"
ADMIN_LOGIN_URL="${FRONTEND_URL}/admin/login"
PUBLIC_QUIZ_URL="${FRONTEND_URL}/"
BACKEND_URL="http://127.0.0.1:5000"

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info() { echo -e "${CYAN}$*${NC}"; }
ok() { echo -e "${GREEN}$*${NC}"; }
err() { echo -e "${RED}$*${NC}" >&2; }

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    err "Missing required command: $1"
    err "Install it, then run this script again."
    exit 1
  fi
}

wait_for_url() {
  local url="$1"
  local label="$2"
  local tries=60
  local i=1
  while [ "$i" -le "$tries" ]; do
    if curl -fsS -o /dev/null "$url" 2>/dev/null; then
      ok "  $label is ready."
      return 0
    fi
    sleep 1
    i=$((i + 1))
  done
  err "  Timed out waiting for $label at $url"
  return 1
}

BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  echo ""
  info "Stopping servers..."
  if [ -n "$BACKEND_PID" ]; then kill "$BACKEND_PID" 2>/dev/null || true; fi
  if [ -n "$FRONTEND_PID" ]; then kill "$FRONTEND_PID" 2>/dev/null || true; fi
  wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo ""
echo -e "${BOLD}TAP V2 — macOS / Linux setup${NC}"
echo "Repository: $ROOT"
echo ""

require_cmd python3
require_cmd node
require_cmd npm
require_cmd curl

info "[1/5] Creating Python virtual environment..."
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi
# shellcheck disable=SC1091
source .venv/bin/activate

info "[2/5] Installing Python dependencies..."
pip install -q --upgrade pip
pip install -q -r backend/requirements.txt

info "[3/5] Configuring backend/.env..."
if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env
  ok "  Created backend/.env from backend/.env.example"
else
  ok "  backend/.env already exists (left unchanged)"
fi

info "[4/5] Installing frontend dependencies..."
(cd frontend && npm install)

info "[5/5] Starting backend and frontend..."
python backend/app.py >"$ROOT/.setup-backend.log" 2>&1 &
BACKEND_PID=$!

(cd frontend && npm run dev) >"$ROOT/.setup-frontend.log" 2>&1 &
FRONTEND_PID=$!

info "Waiting for servers..."
wait_for_url "${BACKEND_URL}/api/hello" "Backend"
wait_for_url "${FRONTEND_URL}/" "Frontend"

echo ""
echo -e "${BOLD}================================================================================${NC}"
echo -e "${BOLD}  TAP V2 is running${NC}"
echo -e "${BOLD}================================================================================${NC}"
echo ""
echo -e "  ${BOLD}Student quiz (public)${NC}"
echo "    $PUBLIC_QUIZ_URL"
echo ""
echo -e "  ${BOLD}Admin dashboard${NC}"
echo "    $ADMIN_LOGIN_URL"
echo ""
echo -e "  ${BOLD}Admin login${NC}"
echo "    Email:    $ADMIN_EMAIL"
echo "    Password: $ADMIN_PASSWORD"
echo ""
echo -e "  ${BOLD}Backend API${NC}"
echo "    $BACKEND_URL"
echo ""
echo "  Dev auto-login: opening /admin/login may sign you in automatically in debug mode."
echo "  Logs: .setup-backend.log and .setup-frontend.log in the repo root."
echo ""
echo -e "  ${BOLD}Press Ctrl+C in this window to stop both servers.${NC}"
echo -e "${BOLD}================================================================================${NC}"
echo ""

wait
