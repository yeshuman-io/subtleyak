import { loadEnv, defineConfig } from '@medusajs/framework/utils'
import { 
  ConfigModule,
  AdminOptions,
} from '@medusajs/types'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

// Log environment variables and config values
console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL ? '[HIDDEN]' : 'undefined',
  REDIS_URL: process.env.REDIS_URL ? '[HIDDEN]' : 'undefined',
  MEDUSA_WORKER_MODE: process.env.MEDUSA_WORKER_MODE,
  ADMIN_CORS: process.env.ADMIN_CORS,
  AUTH_CORS: process.env.AUTH_CORS,
  STORE_CORS: process.env.STORE_CORS,
  MEDUSA_BACKEND_URL: process.env.MEDUSA_BACKEND_URL,
  MEDUSA_DISABLE_ADMIN: process.env.MEDUSA_DISABLE_ADMIN,
})

const config = {
  admin: {
    path: "/nimda" as `/${string}`,
    disable: process.env.MEDUSA_DISABLE_ADMIN === "true",
    backendUrl: process.env.MEDUSA_BACKEND_URL,
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    url: process.env.REDIS_URL,
  },
  workerMode: process.env.MEDUSA_WORKER_MODE as "shared" | "worker" | "server",
  http: {
    adminCors: process.env.ADMIN_CORS!,
    authCors: process.env.AUTH_CORS!,
    storeCors: process.env.STORE_CORS!,
    jwtSecret: process.env.JWT_SECRET || "supersecret",
    cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    cors: {
      origin: [process.env.ADMIN_CORS!, process.env.AUTH_CORS!, process.env.STORE_CORS!].filter(Boolean),
      credentials: true,
    },
  },
  modules: [
    {
      resolve: "./src/modules/vehicles" as const,
    },
    {
      resolve: "./src/modules/wipers" as const,
    },
    {
      resolve: "./src/modules/fitments" as const,
    },
    {
      resolve: "@medusajs/medusa/cache-redis" as const,
      options: {
        redisUrl: process.env.REDIS_URL,
      },
    },
    {
      resolve: "@medusajs/medusa/event-bus-redis" as const,
      options: {
        redisUrl: process.env.REDIS_URL,
      },
    },
    {
      resolve: "@medusajs/medusa/workflow-engine-redis" as const,
      options: {
        redis: {
          url: process.env.REDIS_URL,
        },
      },
    },
  ]
}

// Log the final config object (with sensitive data hidden)
console.log('Medusa Config:', {
  admin: {
    ...config.admin,
    backendUrl: config.admin?.backendUrl ? '[HIDDEN]' : 'undefined'
  },
  database: {
    url: '[HIDDEN]'
  },
  redis: {
    url: '[HIDDEN]'
  },
  http: {
    ...config.http,
    jwtSecret: '[HIDDEN]',
    cookieSecret: '[HIDDEN]'
  },
  modules: config.modules.map(m => ({
    resolve: m.resolve,
    options: 'options' in m ? { ...m.options, redisUrl: '[HIDDEN]' } : undefined
  }))
})

export default defineConfig(config)
