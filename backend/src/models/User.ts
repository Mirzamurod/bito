import { Schema, model, type InferSchemaType, type Types } from 'mongoose'

export const USER_ROLES = ['admin', 'cashier'] as const
export type UserRole = (typeof USER_ROLES)[number]

const userSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: USER_ROLES },
  },
  { timestamps: true },
)

userSchema.index({ tenantId: 1, email: 1 }, { unique: true })

export type UserDocument = InferSchemaType<typeof userSchema> & {
  _id: Types.ObjectId
  tenantId: Types.ObjectId
}

export const User = model('User', userSchema)
