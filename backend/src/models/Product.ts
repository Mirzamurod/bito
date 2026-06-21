import { Schema, model, type InferSchemaType, type Types } from 'mongoose'

const productSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, uppercase: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    version: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
)

productSchema.index({ tenantId: 1, sku: 1 }, { unique: true })
productSchema.index({ tenantId: 1, categoryId: 1 })
productSchema.index({ tenantId: 1, name: 1 })

export type ProductDocument = InferSchemaType<typeof productSchema> & {
  _id: Types.ObjectId
  tenantId: Types.ObjectId
  categoryId: Types.ObjectId
}

export const Product = model('Product', productSchema)
