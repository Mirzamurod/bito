import { Schema, model, type InferSchemaType } from 'mongoose'

const tenantSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  },
  { timestamps: true },
)

export type TenantDocument = InferSchemaType<typeof tenantSchema>

export const Tenant = model('Tenant', tenantSchema)
