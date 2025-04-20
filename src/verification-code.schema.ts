import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class VerificationCode extends Document {
  @Prop({ required: true, index: true })
  email: string;

  @Prop({ required: true })
  code: string;

  @Prop({ required: true, expires: 600 }) // Expires after 10 minutes
  expiresAt: Date;
}

export const VerificationCodeSchema = SchemaFactory.createForClass(VerificationCode);