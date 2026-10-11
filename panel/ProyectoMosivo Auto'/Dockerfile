FROM mcr.microsoft.com/playwright:v1.60.0-noble

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends novnc websockify x11vnc xvfb \
    && rm -rf /var/lib/apt/lists/*

RUN apt-get update \
    && apt-get install -y --no-install-recommends openbox \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY api_server.js automation_engine.js bulk_runner.js terminal_runner.js ./
COPY public ./public
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN mkdir -p /app/data /tmp/.X11-unix \
    && chmod 1777 /tmp/.X11-unix \
    && chown -R pwuser:pwuser /app \
    && chmod +x /usr/local/bin/docker-entrypoint.sh

USER pwuser

ENV PORT=3002 \
    DISPLAY=:99 \
    NOVNC_PORT=6081 \
    PROFILE_DATA_FILE=/app/data/config.json \
    AUTOMATION_DATA_DIR=/app/data

EXPOSE 3002 6081

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
