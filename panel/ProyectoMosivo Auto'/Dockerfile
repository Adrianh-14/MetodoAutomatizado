FROM mcr.microsoft.com/playwright:v1.60.0-noble

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends xvfb \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY api_server.js automation_engine.js bulk_runner.js terminal_runner.js ./
COPY public ./public
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN mkdir -p /app/data \
    && chown -R pwuser:pwuser /app \
    && chmod +x /usr/local/bin/docker-entrypoint.sh

USER pwuser

ENV PORT=3002 \
    DISPLAY=:99 \
    PROFILE_DATA_FILE=/app/data/config.json \
    AUTOMATION_DATA_DIR=/app/data

EXPOSE 3002

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
