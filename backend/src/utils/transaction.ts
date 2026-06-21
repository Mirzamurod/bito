import type { ClientSession } from 'mongoose'
import mongoose from 'mongoose'

const TRANSACTION_UNSUPPORTED_PATTERNS = [
  'Transaction numbers are only allowed',
  'replica set member or mongos',
  'does not support retryable writes',
  'Transaction api not supported',
] as const

function collectErrorChain(error: unknown): unknown[] {
  const chain: unknown[] = []
  let current: unknown = error
  const seen = new Set<object>()

  while (current && typeof current === 'object' && !seen.has(current)) {
    seen.add(current)
    chain.push(current)

    const withNested = current as { cause?: unknown; originalError?: unknown }
    current = withNested.cause ?? withNested.originalError
  }

  return chain
}

function getErrorMessages(error: unknown): string[] {
  return collectErrorChain(error)
    .filter((item): item is Error => item instanceof Error)
    .map(item => item.message)
}

function hasIllegalOperationCode(error: unknown): boolean {
  return collectErrorChain(error).some(
    item =>
      typeof item === 'object' &&
      item !== null &&
      'code' in item &&
      (item as { code?: number }).code === 20,
  )
}

export function isTransactionNotSupported(error: unknown): boolean {
  const messages = getErrorMessages(error)

  if (
    messages.some(message =>
      TRANSACTION_UNSUPPORTED_PATTERNS.some(pattern => message.includes(pattern)),
    )
  ) {
    return true
  }

  return hasIllegalOperationCode(error)
}

export async function runInTransaction<T>(fn: (session: ClientSession) => Promise<T>): Promise<T> {
  const session = await mongoose.startSession()

  try {
    session.startTransaction()
    const result = await fn(session)
    await session.commitTransaction()
    return result
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction()
    }

    throw error
  } finally {
    await session.endSession()
  }
}
