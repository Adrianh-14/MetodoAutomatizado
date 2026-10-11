#!/usr/bin/env bash
set -euo pipefail

mkdir -p "${AUTOMATION_DATA_DIR:-/app/data}"

display="${DISPLAY:-:99}"
novnc_port="${NOVNC_PORT:-6081}"
display_number="${display#:}"
display_number="${display_number%%.*}"
display_lock="/tmp/.X${display_number}-lock"
display_socket="/tmp/.X11-unix/X${display_number}"

# Docker conserva /tmp al reiniciar el mismo contenedor. Si Xvfb fue terminado
# por Docker, puede quedar un lock sin proceso asociado que impide arrancar de
# nuevo. Solo eliminamos los archivos cuando el PID registrado ya no existe.
if [[ -f "$display_lock" ]]; then
    display_pid="$(tr -d '[:space:]' < "$display_lock")"
    if [[ "$display_pid" =~ ^[0-9]+$ ]] && kill -0 "$display_pid" 2>/dev/null; then
        echo "La pantalla $display ya está siendo utilizada por el PID $display_pid" >&2
        exit 1
    fi

    rm -f -- "$display_lock" "$display_socket"
elif [[ -S "$display_socket" ]]; then
    rm -f -- "$display_socket"
fi

Xvfb "$display" -screen 0 1440x900x24 -ac -nolisten tcp +extension RANDR &

# Xvfb tarda unas fracciones de segundo en aceptar conexiones. Reintentamos
# para que el visor no falle de forma intermitente al arrancar el contenedor.
for attempt in $(seq 1 50); do
    if x11vnc -display "$display" -forever -shared -nopw \
        -rfbport 5900 -listen 127.0.0.1 -bg -o /tmp/x11vnc.log; then
        break
    fi
    sleep 0.1
done

if ! pgrep -x x11vnc >/dev/null; then
    cat /tmp/x11vnc.log >&2 || true
    echo "No se pudo iniciar el visor VNC" >&2
    exit 1
fi

# Un gestor de ventanas permite que Chromium se dibuje, reciba foco y respete
# su posición dentro del escritorio virtual visible desde noVNC.
DISPLAY="$display" openbox --sm-disable >/tmp/openbox.log 2>&1 &

websockify --web=/usr/share/novnc "0.0.0.0:${novnc_port}" 127.0.0.1:5900 &

exec node api_server.js
