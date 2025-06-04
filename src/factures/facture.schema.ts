import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Reservation } from '../reservations/reservation.schema';
import { Prestataire } from '../prestataires/prestataire.schema';
import { Client } from '../clients/client.schema';

@Schema({ timestamps: true })
export class Facture extends Document {
 @Prop({ type: Types.ObjectId, ref: 'Reservation', required: true, unique: true })
  reservationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Prestataire', required: true })
  prestataireId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Client', required: true })
  clientId: Types.ObjectId;

  @Prop({ required: true })
  service: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true })
  price: number;

  @Prop({ default: false })
  discountApplied: boolean;

  @Prop()
  request: string;

  @Prop() // Removed required: true to make pdfPath optional
  pdfPath: string;
}
export const FactureSchema = SchemaFactory.createForClass(Facture);
FactureSchema.index({ reservationId: 1 }, { unique: true });