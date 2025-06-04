// import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
// import { Document } from 'mongoose';

// @Schema({ timestamps: true }) // Ajoute createdAt et updatedAt
// export class Prestataire extends Document {
//   @Prop({ required: true })
//   name: string;

//   @Prop({ required: true, unique: true })
//   email: string;

//   @Prop({ required: true })
//   password: string; // À hasher en production

//   @Prop({ required: true })
//   job: string; // Ex: "Plumber", "Electrician", etc.
  
//   @Prop({ required: true })
//   category: string; // Nouvelle propriété pour la catégorie

//   @Prop({ required: true })
//   businessAddress: string; // Adresse professionnelle

//   @Prop({ required: true, default: true })
//   available: boolean; // Disponible maintenant (true/false)

//   @Prop({ required: true })
//   minPrice: number; // Prix minimum pour un service

//   @Prop({ required: true })
//   maxPrice: number; // Prix maximum pour un service

//   @Prop({ required: true, unique: true })
//   businessID: string; // Identifiant unique de l’entreprise (remplace business_id pour cohérence)

//   @Prop({ required: false })
//   image: string; // URL ou chemin de l’image (facultatif)

//   @Prop({ required: false })
//   facebook: string; // Lien vers la page Facebook

//   @Prop({ required: false })
//   instagram: string; // Lien vers le profil Instagram

//   @Prop({ required: false })
//   website: string; // Lien vers le site web

//   @Prop({ required: false })
//   phoneNumber: string; // Numéro de téléphone

//    // Modified to store average rating
//    @Prop({ default: 0 })
//    rating: number;
 
//    // Added to track number of ratings for accurate averaging
//    @Prop({ default: 0 })
//    ratingCount: number;

//    //lele dashboard
//   @Prop({ default: false })
//   isFlagged: boolean;
//   @Prop()
//   flagReason?: string;
// }

// export const PrestataireSchema = SchemaFactory.createForClass(Prestataire);
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Prestataire extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  job: string;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  businessAddress: string;

  @Prop({ required: true, default: true })
  available: boolean;

  @Prop({ required: true })
  minPrice: number;

  @Prop({ required: true })
  maxPrice: number;

  @Prop({ required: true, unique: true })
  businessID: string;

  @Prop({ required: false })
  image: string;

  @Prop({ required: false })
  facebook: string;

  @Prop({ required: false })
  instagram: string;

  @Prop({ required: false })
  website: string;

  @Prop({ required: false })
  phoneNumber: string;

  @Prop({ default: 0 })
  rating: number;

  @Prop({ default: 0 })
  ratingCount: number;

  @Prop({ default: false })
  isFlagged: boolean;

  // @Prop()
  // flagReason?: string;
  @Prop({ type: [String], default: [] }) // Changed to array of strings
  flagReason?: string[];

  @Prop({ default: 0 })
  flagCount: number; // New field to track number of flags

  @Prop()
  deactivationUntil?: Date; // New field for temporary deactivation

  @Prop({ default: 'actif' })
  status: string;

  @Prop()
  deletionReason?: string;

  @Prop()
  deletedAt?: Date;
}

export const PrestataireSchema = SchemaFactory.createForClass(Prestataire);