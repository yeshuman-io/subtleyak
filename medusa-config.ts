import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  admin: {
    disable: process.env.MEDUSA_DISABLE_ADMIN === "true",
    backendUrl: process.env.MEDUSA_BACKEND_URL,
    vite: (config) => {
      let host = process.env.MEDUSA_BACKEND_URL;

      if (host) {
        if (host.startsWith("http")) {
          host = new URL(host).hostname;
        }

        config.server.allowedHosts = [host];
      }

      return config;
    },
  },
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    workerMode: process.env.MEDUSA_WORKER_MODE as "shared" | "worker" | "server",
    http: {
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      storeCors: process.env.STORE_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
    redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
    redisPrefix: "medusa:",
  },
  modules: [
    {
      resolve: "./src/modules/vehicles"
    },
    {
      resolve: "./src/modules/wipers"
    },
    {
      resolve: "./src/modules/fitments"
    },
    {
      resolve: "@medusajs/medusa/cache-redis",
      options: {
        redisUrl: process.env.REDIS_URL,
      },
    },
    {
      resolve: "@medusajs/medusa/event-bus-redis",
      options: {
        redisUrl: process.env.REDIS_URL,
      },
    },
    {
      resolve: "@medusajs/medusa/workflow-engine-redis",
      options: {
        redis: {
          url: process.env.REDIS_URL,
        },
      },
    },
  ]
})
