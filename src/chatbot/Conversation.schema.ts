// import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
// import { Document } from 'mongoose';

// export type ConversationDocument = Conversation & Document;

// @Schema()
// export class Message {
//   @Prop({ required: true })
//   text: string;

//   @Prop({ required: true })
//   isUser: boolean;

//   @Prop({ required: true })
//   timestamp: Date;
// }

// @Schema({ timestamps: true })
// export class Conversation {
//   @Prop({ required: true, index: true })
//   userId: string;

//   @Prop({ type: [Message], default: [] })
//   messages: Message[];

//   @Prop({ required: true, enum: ['en', 'fr', 'ar', 'tn'] })
//   lastLanguage: string;

//   @Prop({ enum: ['ltr', 'rtl'], default: 'ltr' })
//   direction: string;

//   @Prop({ required: true })
//   updatedAt: Date;
// }



























// export const ConversationSchema = SchemaFactory.createForClass(Conversation);
// import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
// import { Document } from 'mongoose';

// export type ConversationDocument = Conversation & Document;

// @Schema()
// export class Message {
//   @Prop({ required: true })
//   text: string;

//   @Prop({ required: true })
//   isUser: boolean;

//   @Prop({ required: true })
//   timestamp: Date;
// }

// @Schema()
// export class Conversation {
//   @Prop({ required: true })
//   userId: string;

//   @Prop({ type: [Message], default: [] })
//   messages: Message[];

//   @Prop({ required: true })
//   lastLanguage: string;

//   @Prop({ required: true })
//   updatedAt: Date;

//   @Prop({ required: true, enum: ['ltr', 'rtl'] })
//   direction: string;
// }

// export const ConversationSchema = SchemaFactory.createForClass(Conversation);






















import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ConversationDocument = Conversation & Document;

@Schema()
export class Message {
  @Prop({ required: true })
  text: string;

  @Prop({ required: true })
  isUser: boolean;

  @Prop({ required: true })
  timestamp: Date;
}

@Schema({ timestamps: true })
export class Conversation {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ type: [Message], default: [] })
  messages: Message[];

  @Prop({ required: true, enum: ['en', 'fr', 'ar', 'tn'] })
  lastLanguage: string;

  @Prop({ enum: ['ltr', 'rtl'], default: 'ltr' })
  direction: string;

  @Prop({ required: true })
  updatedAt: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);