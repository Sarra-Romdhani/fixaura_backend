// src/locations/location.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Location extends Document {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Prestataire' })
  prestataireId: Types.ObjectId;

  @Prop({ type: { lat: Number, lng: Number }, required: true })
  coordinates: { lat: number; lng: number };

  @Prop({ required: true })
  reservationId: string;
  
  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const LocationSchema = SchemaFactory.createForClass(Location);