import { env } from '../config/env'
import { signHmacSha256 } from '../utils/hmac'

function readArg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 ? process.argv[index + 1] : undefined
}

async function main() {
  const orderId = readArg('orderId')
  const tenantId = readArg('tenantId')
  const eventId = readArg('eventId') ?? `evt_${Date.now()}`
  const apiUrl = readArg('url') ?? `http://localhost:${env.PORT}/api/webhooks/payment`

  if (!orderId || !tenantId) {
    console.error(
      'Usage: npm run simulate-payment -- --orderId=<id> --tenantId=<id> [--eventId=evt_123]',
    )
    process.exit(1)
  }

  const body = JSON.stringify({
    eventId,
    orderId,
    tenantId,
    status: 'paid',
  })

  const signature = signHmacSha256(body, env.PAYMENT_WEBHOOK_SECRET)

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Signature': signature,
    },
    body,
  })

  const responseBody = await response.text()

  console.log('')
  console.log(`POST ${apiUrl}`)
  console.log(`Status: ${response.status}`)
  console.log(responseBody)
  console.log('')
  console.log('Idempotency test (same eventId):')
  console.log(
    `npm run simulate-payment -- --orderId=${orderId} --tenantId=${tenantId} --eventId=${eventId}`,
  )
}

main().catch(error => {
  console.error('[simulate-payment] Failed', error)
  process.exit(1)
})
