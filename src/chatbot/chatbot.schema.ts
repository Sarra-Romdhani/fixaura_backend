import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ConversationDocument = Conversation & Document;

@Schema()
export class Message {
  @Prop()
  text: string;

  @Prop()
  isUser: boolean;
}

@Schema()
export class Conversation {
  @Prop()
  userId: string;

  @Prop({ type: [Message] })
  messages: Message[];

  @Prop()
  language: string;

  @Prop()
  timestamp: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
