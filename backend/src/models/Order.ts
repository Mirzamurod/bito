import { Schema, model, type InferSchemaType, type Types } from 'mongoose'

export const ORDER_STATUSES = ['pending_payment', 'paid', 'cancelled'] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

const orderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    unitCostPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
)

const orderSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    cashierId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, required: true, enum: ORDER_STATUSES, default: 'pending_payment' },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: [(v: unknown[]) => v.length > 0, 'Order must have items'],
    },
    subtotal: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paidAt: { type: Date },
  },
  { timestamps: true },
)

orderSchema.index({ tenantId: 1, status: 1, createdAt: -1 })

export type OrderItem = InferSchemaType<typeof orderItemSchema>
export type OrderDocument = InferSchemaType<typeof orderSchema> & {
  _id: Types.ObjectId
  tenantId: Types.ObjectId
  cashierId: Types.ObjectId
}

export const Order = model('Order', orderSchema)
