FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY package.json ./

RUN npm install

COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

RUN npx prisma generate
RUN npx tsc

EXPOSE 3001

CMD ["node", "dist/index.js"]
