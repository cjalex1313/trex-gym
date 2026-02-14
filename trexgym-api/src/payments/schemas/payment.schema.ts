import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PaymentDocument = HydratedDocument<Payment>;

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  TRANSFER = 'transfer',
}

@Schema({ timestamps: true, collection: 'payments' })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'Subscription', required: true, index: true })
  subscriptionId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Client', required: true, index: true })
  clientId!: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 0.01 })
  amount!: number;

  @Prop({ type: Date, required: true })
  paymentDate!: Date;

  @Prop({
    type: String,
    enum: Object.values(PaymentMethod),
    required: true,
  })
  method!: PaymentMethod;

  @Prop({ type: String, trim: true, maxlength: 500, default: null })
  notes?: string | null;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

PaymentSchema.index({ clientId: 1, paymentDate: -1 });
