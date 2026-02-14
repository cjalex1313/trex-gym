import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ClientDocument = HydratedDocument<Client>;

export enum ClientStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  INVITED = 'invited',
}

@Schema({ timestamps: true, collection: 'clients' })
export class Client {
  @Prop({ required: true, trim: true })
  firstName!: string;

  @Prop({ required: true, trim: true })
  lastName!: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  email!: string;

  @Prop({ required: true, trim: true })
  phone!: string;

  @Prop({ required: true })
  pinHash!: string;

  @Prop({
    type: String,
    enum: Object.values(ClientStatus),
    default: ClientStatus.INVITED,
    index: true,
  })
  status!: ClientStatus;

  @Prop({
    type: String,
    default: undefined,
    unique: true,
    sparse: true,
    index: true,
  })
  qrToken?: string;

  @Prop({ type: Date, default: null })
  qrTokenExpiresAt?: Date | null;
}

export const ClientSchema = SchemaFactory.createForClass(Client);
