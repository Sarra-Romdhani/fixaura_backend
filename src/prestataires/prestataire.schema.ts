import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true }) // Ajoute createdAt et updatedAt
export class Prestataire extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string; // À hasher en production

  @Prop({ required: true })
  category: string; // Remplace "type" pour correspondre à ta demande initiale (ex: "Plumber", "Electrician")

  @Prop({ required: true })
  location: string; // Ex: "Tunis", "Sfax", etc.

  @Prop({ required: true, default: true })
  available: boolean; // Disponible maintenant (true/false)

  @Prop({ required: true })
  minPrice: number; // Prix minimum pour un service

  @Prop({ required: true })
  maxPrice: number; // Prix maximum pour un service

  @Prop({ required: true, unique: true })
  businessID: string; // Identifiant unique de l’entreprise (remplace business_id pour cohérence)

  @Prop({ required: false })
  image: string; // URL ou chemin de l’image (facultatif)

  @Prop({ required: false })
  phoneNumber: string;

  @Prop({ required: false })
  facebook: string;

  @Prop({ required: false })
  instagram: string;

  @Prop({ required: false })
  website: string;

  @Prop({ required: false })
  serviceName: string;
}

export const PrestataireSchema = SchemaFactory.createForClass(Prestataire);