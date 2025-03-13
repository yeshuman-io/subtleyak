FROM node:current-alpine
RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install  --frozen-lockfile

COPY medusa-config.ts tsconfig.json ./
COPY src/ ./src/

ARG DATABASE_URL=""
ARG REDIS_URL=""
ARG PGDATABASE=""
RUN echo "DATABASE_URL=${DATABASE_URL}" >> .env \
    echo "REDIS_URL=${REDIS_URL}" >> .env \
    echo "DB_NAME=${PGDATABASE}" >> .env

EXPOSE 9000
ENTRYPOINT ["pnpm"]
CMD ["medusa", "start", "-H", "0.0.0.0", "-p", "9000"]
