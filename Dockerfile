FROM node:current-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy configuration files
COPY medusa-config.ts tsconfig.json ./
COPY entrypoint.sh ./
COPY .env* ./

# Copy source code with complete directory structure
COPY src/ ./src/

# Ensure correct permissions
RUN chmod +x entrypoint.sh

EXPOSE 9000

ENTRYPOINT ["./entrypoint.sh"]
CMD ["npx", "medusa", "start", "-H", "0.0.0.0", "-p", "9000"]
