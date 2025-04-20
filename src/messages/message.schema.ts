import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Message extends Document {
  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  senderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  receiverId: Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ default: false })
  isLocationCard: boolean;

  @Prop({ type: { lat: Number, lng: Number }, required: false })
  location?: { lat: number; lng: number };

  @Prop({ type: Types.ObjectId, ref: 'Reservation', required: false })
  reservationId?: Types.ObjectId;

  @Prop({ default: false })
  isRatingPrompt: boolean;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);