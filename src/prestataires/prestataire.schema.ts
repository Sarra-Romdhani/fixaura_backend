
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