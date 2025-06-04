import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Comment {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  text: string;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

@Schema({ timestamps: true })
export class Publication extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  //@Prop({ default: '' })
  @Prop({ type: String, default: '' }) // Ensure picture is a string and optional
  picture: string;

  @Prop({ required: true })
  providerId: string;

  @Prop({ type: [String], default: [] })
  likes: string[];

  @Prop({ type: [CommentSchema], default: [] })
  comments: Comment[];
}

export const PublicationSchema = SchemaFactory.createForClass(Publication);