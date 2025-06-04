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

  @Prop({ required: true, enum: ['Indépendant', 'Société'] })
  status: string;

  @Prop({ default: 0 })
  rating: number;

  @Prop({ default: 0 })
  ratingCount: number;
}

export const PrestataireSchema = SchemaFactory.createForClass(Prestataire);