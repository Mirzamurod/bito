import crypto from 'crypto'

export function signHmacSha256(payload: string | Buffer, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

export function verifyHmacSha256(
  payload: string | Buffer,
  signature: string,
  secret: string,
): boolean {
  const expected = signHmacSha256(payload, secret)

  if (expected.length !== signature.length) {
    return false
  }

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}
