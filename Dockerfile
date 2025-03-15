FROM node:current-alpine
RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY medusa-config.ts tsconfig.json entrypoint.sh ./
COPY src/ ./src/

EXPOSE 9000

ENTRYPOINT ["./entrypoint.sh"]

CMD ["medusa", "start", "-H", "0.0.0.0"]
