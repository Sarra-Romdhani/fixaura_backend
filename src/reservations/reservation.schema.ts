import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ReservationDocument = Reservation & Document;

@Schema()
export class Reservation extends Document {
  
  @Prop({ required: true, ref: 'Client' })
  id_client: string;

  @Prop({ required: true, ref: 'Prestataire' })
  id_prestataire: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  location: string;

  @Prop({
    required: true,
    enum: ['pending', 'confirmed', 'canceled', 'completed', 'waiting'],
    default: 'pending',
  })
  status: string;

  @Prop({ required: true })
  service: string;

  @Prop({ required: false })
  price?: number;

  @Prop({ required: false })
  request?: string;

  @Prop({ type: String })
  qrCode?: string;

  @Prop({ default: false })
  isRated: boolean;

  @Prop({ default: false })
  discountApplied: boolean;
}

export const ReservationSchema = SchemaFactory.createForClass(Reservation);