FROM node:current-alpine

WORKDIR /app

COPY package.json /app/package.json
COPY pnpm-lock.yaml /app/pnpm-lock.yaml

RUN npm install -g pnpm && pnpm install

CMD bash
