import { Schema, model, type InferSchemaType, type Types } from 'mongoose'

const categorySchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true },
)

categorySchema.index({ tenantId: 1, name: 1 })

export type CategoryDocument = InferSchemaType<typeof categorySchema> & {
  _id: Types.ObjectId
  tenantId: Types.ObjectId
}

export const Category = model('Category', categorySchema)
