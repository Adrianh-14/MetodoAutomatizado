#!/usr/bin/env bash
set -euo pipefail

mkdir -p "${AUTOMATION_DATA_DIR:-/app/data}"

Xvfb "${DISPLAY:-:99}" -screen 0 1280x720x24 -ac +extension RANDR &

exec node api_server.js
