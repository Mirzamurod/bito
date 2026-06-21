import { connectDB, disconnectDB } from '../db/connection'
import { User } from '../models/User'
import { signAccessToken } from '../services/authService'

async function main() {
  const email = process.argv[2]

  if (!email) {
    console.error('Usage: npm run token -- <email>')
    console.error('Example: npm run token -- cashier@demo.com')
    process.exit(1)
  }

  await connectDB()

  const user = await User.findOne({ email: email.toLowerCase() }).lean()

  if (!user) {
    console.error(`[token] User not found: ${email}`)
    process.exit(1)
  }

  const token = signAccessToken({
    sub: user._id.toString(),
    tenantId: user.tenantId.toString(),
    role: user.role,
  })

  console.log('')
  console.log(`User: ${email} (${user.role})`)
  console.log('')
  console.log(token)
  console.log('')
  console.log('Test:')
  console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:4000/api/me`)
}

main()
  .catch(error => {
    console.error('[token] Failed', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await disconnectDB()
  })
