FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json vite.config.js index.html ./
COPY public ./public
COPY src ./src

RUN npm run build

FROM alpine:3.22 AS runtime

RUN apk add --no-cache nginx \
    && rm -f /etc/nginx/http.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/http.d/default.conf

EXPOSE 4173

CMD ["nginx", "-g", "daemon off;"]
