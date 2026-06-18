FROM mcr.microsoft.com/playwright:v1.60.0-focal

WORKDIR /app

RUN apt-get update && apt-get install -y xvfb && rm -rf /var/lib/apt/lists/*

COPY package.json ./
RUN npm install

COPY api_server.js automation_engine.js bulk_runner.js terminal_runner.js ./
COPY config.json ./
COPY public ./public

ENV PORT=3002
EXPOSE 3002

RUN echo '#!/bin/bash' > /entrypoint.sh && \
    echo 'Xvfb :99 -screen 0 1280x720x24 -ac +extension RANDR &' >> /entrypoint.sh && \
    echo 'export DISPLAY=:99' >> /entrypoint.sh && \
    echo 'node api_server.js' >> /entrypoint.sh && \
    chmod +x /entrypoint.sh

CMD ["/bin/bash", "/entrypoint.sh"]
