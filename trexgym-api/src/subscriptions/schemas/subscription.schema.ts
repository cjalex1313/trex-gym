import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SubscriptionDocument = HydratedDocument<Subscription>;

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export enum SubscriptionPlanType {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  SEMIANNUAL = 'semiannual',
  ANNUAL = 'annual',
  CUSTOM = 'custom',
}

export enum CurrencyCode {
  RON = 'RON',
  EUR = 'EUR',
}

@Schema({ timestamps: true, collection: 'subscriptions' })
export class Subscription {
  @Prop({ type: Types.ObjectId, ref: 'Client', required: true, index: true })
  clientId!: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(SubscriptionPlanType),
    required: true,
  })
  planType!: SubscriptionPlanType;

  @Prop({ type: String, trim: true, maxlength: 100, default: null })
  planName?: string | null;

  @Prop({ type: Date, required: true })
  startDate!: Date;

  @Prop({ type: Date, required: true })
  endDate!: Date;

  @Prop({
    type: String,
    enum: Object.values(SubscriptionStatus),
    default: SubscriptionStatus.ACTIVE,
    index: true,
  })
  status!: SubscriptionStatus;

  @Prop({ type: Number, required: true, min: 0 })
  price!: number;

  @Prop({
    type: String,
    enum: Object.values(CurrencyCode),
    default: CurrencyCode.RON,
  })
  currency!: CurrencyCode;

  @Prop({ type: String, trim: true, maxlength: 500, default: null })
  notes?: string | null;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);

SubscriptionSchema.index({ clientId: 1, status: 1 });
SubscriptionSchema.index({ endDate: 1 });
