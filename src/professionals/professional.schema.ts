// src/professionals/professional.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Professional extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string; // À hasher en production

  @Prop({ required: true })
  type: string; // Ex: "Plumber", "Electrician", etc.

  @Prop({ required: true })
  location: string; // Ex: "Tunis", "Sfax", etc.

  @Prop({ required: true, default: false })
  available: boolean; // Disponible maintenant (true/false)

  @Prop({ required: true })
  minPrice: number; // Prix minimum pour un service

  @Prop({ required: true })
  maxPrice: number; // Prix maximum pour un service
}

export const ProfessionalSchema = SchemaFactory.createForClass(Professional);