import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Client extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  homeAddress: string;

  @Prop({ required: false })
  image: string;

  @Prop()
  phoneNumber: string;

  @Prop({ default: false })
  isFlagged: boolean;

  @Prop()
  flagReason?: string;

  @Prop({ default: 0 })
  flagCount: number; // New field to track number of flags

  @Prop()
  deactivationUntil?: Date; // New field for temporary deactivation

  @Prop({ default: 'actif' })
  status: string; // 'actif' or 'supprimé'

  @Prop()
  deletionReason?: string;

  @Prop()
  deletedAt?: Date;
}

export const ClientSchema = SchemaFactory.createForClass(Client);