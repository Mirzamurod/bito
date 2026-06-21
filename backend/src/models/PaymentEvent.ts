import { Schema, model, type InferSchemaType, type Types } from 'mongoose'

const paymentEventSchema = new Schema(
  {
    eventId: { type: String, required: true, unique: true, trim: true },
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    processedAt: { type: Date, required: true, default: Date.now },
    payload: { type: Schema.Types.Mixed },
  },
  { timestamps: false },
)

export type PaymentEventDocument = InferSchemaType<typeof paymentEventSchema> & {
  _id: Types.ObjectId
  tenantId: Types.ObjectId
  orderId: Types.ObjectId
}

export const PaymentEvent = model('PaymentEvent', paymentEventSchema)
