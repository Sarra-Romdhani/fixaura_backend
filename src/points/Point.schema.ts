// src/points/points.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Points extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true, ref: 'Prestataire' })
  prestataireId: string;

  @Prop({ required: true, default: 0 })
  points: number;
}

export const PointsSchema = SchemaFactory.createForClass(Points);
// Optional: Add unique index
PointsSchema.index({ userId: 1, prestataireId: 1 }, { unique: true });