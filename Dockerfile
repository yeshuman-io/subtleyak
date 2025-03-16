FROM node:current-alpine

WORKDIR /app

COPY package.json ./

RUN npm install

COPY medusa-config.ts tsconfig.json entrypoint.sh ./
COPY src/ ./src/

EXPOSE 9000

ENTRYPOINT ["./entrypoint.sh"]
CMD ["npx", "medusa", "start", "-H", "0.0.0.0", "-p", "9000"]
