import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Reservation extends Document {
  @Prop({ required: true })
  id_client: string; // ID of the client

  @Prop({ required: true })
  id_prestataire: string; // ID of the prestataire

  @Prop({ required: true })
  date: Date; // Date of the reservation

  @Prop({ required: true })
  location: string; // Home address of the client

  @Prop({ required: true, enum: ['pending', 'confirmed', 'cancelled'] })
  status: string; // Status of the reservation

  @Prop({ required: true })
  service: string; // Type of service (e.g., "Gourmet Chef", "Wellness Guru")
}

export const ReservationSchema = SchemaFactory.createForClass(Reservation);