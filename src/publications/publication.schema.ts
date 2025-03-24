import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true }) // Ajoute createdAt et updatedAt automatiquement
export class Publication extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop()
  picture: string; // URL ou chemin de l'image

  @Prop({ required: true })
  providerId: string; // ID du prestataire qui a publié
}

export const PublicationSchema = SchemaFactory.createForClass(Publication);