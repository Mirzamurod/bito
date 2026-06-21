import cors from 'cors'
import express from 'express'
import helmet from 'helmet'

import { env } from './config/env'
import { getDbStatus } from './db/connection'
import { errorHandler } from './middleware/errorHandler'
import { apiRouter } from './routes'
import { webhooksRouter } from './routes/webhooks.routes'

export function createApp() {
  const app = express()

  app.use(helmet())
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  )

  app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhooksRouter)

  app.use(express.json())

  app.get('/health', (_req, res) => {
    const db = getDbStatus()
    const isHealthy = db === 'connected'

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'ok' : 'degraded',
      db,
      timestamp: new Date().toISOString(),
    })
  })

  app.use('/api', apiRouter)

  app.use(errorHandler)

  return app
}
