import mongoose from 'mongoose'

import { env } from '../config/env'

const RETRY_DELAY_MS = 2000

export type DbStatus = 'connected' | 'disconnected' | 'connecting'

export function getDbStatus(): DbStatus {
  switch (mongoose.connection.readyState) {
    case 0:
      return 'disconnected'
    case 1:
      return 'connected'
    case 2:
      return 'connecting'
    default:
      return 'disconnected'
  }
}

export async function connectDB(maxRetries = 5): Promise<void> {
  mongoose.set('strictQuery', true)

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await mongoose.connect(env.MONGODB_URI)
      console.log('[db] MongoDB connected')
      return
    } catch (error) {
      const isLastAttempt = attempt === maxRetries
      console.error(`[db] Connection attempt ${attempt}/${maxRetries} failed`, error)

      if (isLastAttempt) {
        throw error
      }

      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS))
    }
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect()
  console.log('[db] MongoDB disconnected')
}
