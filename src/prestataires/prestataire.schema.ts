import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Prestataire extends Document {
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

  @Prop({ required: true, default: true })
  available: boolean; // Disponible maintenant (true/false)

  @Prop({ required: true })
  minPrice: number; // Prix minimum pour un service

  @Prop({ required: true })
  maxPrice: number; // Prix maximum pour un service

  @Prop({ required: true, unique: true })
  business_id: string; // Identifiant unique de l’entreprise

  @Prop({ required: false })
  image: string; // URL ou chemin de l’image (facultatif)
}

export const PrestataireSchema = SchemaFactory.createForClass(Prestataire);