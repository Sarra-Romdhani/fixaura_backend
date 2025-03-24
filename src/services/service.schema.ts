import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Service extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  estimatedDuration: number;

  @Prop({ required: true })
  photo: string;

  @Prop({ type: String, ref: 'Prestataire', required: true })
  prestataireId: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);