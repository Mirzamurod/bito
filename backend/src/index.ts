import { createApp } from './app'
import { env } from './config/env'
import { connectDB, disconnectDB } from './db/connection'
import { syncProductIndexes } from './services/productService'

async function start() {
  await connectDB()
  await syncProductIndexes()

  const app = createApp()
  const server = app.listen(env.PORT, () => {
    console.log(`[server] Listening on http://localhost:${env.PORT}`)
  })

  const shutdown = async (signal: string) => {
    console.log(`[server] ${signal} received, shutting down...`)
    server.close(async () => {
      await disconnectDB()
      process.exit(0)
    })
  }

  process.on('SIGINT', () => void shutdown('SIGINT'))
  process.on('SIGTERM', () => void shutdown('SIGTERM'))
}

start().catch(error => {
  console.error('[server] Failed to start', error)
  process.exit(1)
})
