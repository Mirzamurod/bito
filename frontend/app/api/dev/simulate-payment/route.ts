import crypto from 'crypto'
import { NextResponse } from 'next/server'

import { auth } from '@/auth'

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const orderId = typeof body?.orderId === 'string' ? body.orderId : null

  if (!orderId) {
    return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
  }

  const secret = process.env.PAYMENT_WEBHOOK_SECRET

  if (!secret) {
    return NextResponse.json({ error: 'PAYMENT_WEBHOOK_SECRET is not configured' }, { status: 500 })
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL

  if (!apiBaseUrl) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_API_URL is not configured' }, { status: 500 })
  }

  const webhookBody = JSON.stringify({
    eventId: `evt_dev_${Date.now()}`,
    orderId,
    tenantId: session.user.tenantId,
    status: 'paid',
  })

  const signature = crypto.createHmac('sha256', secret).update(webhookBody).digest('hex')

  const response = await fetch(`${apiBaseUrl}/api/webhooks/payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Signature': signature,
    },
    body: webhookBody,
  })

  const responseText = await response.text()

  return new NextResponse(responseText, {
    status: response.status,
    headers: { 'Content-Type': 'application/json' },
  })
}
