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

  @Prop({ type: [String], default: [] }) // Changed to array of strings for multiple images
  pictures: string[];

  @Prop({ required: true })
  providerId: string;

  @Prop({ type: [String], default: [] })
  likes: string[];

  @Prop({ type: [CommentSchema], default: [] })
  comments: Comment[];
}

export const PublicationSchema = SchemaFactory.createForClass(Publication);










// import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
// import { Document, Schema as MongooseSchema } from 'mongoose';

// @Schema({ timestamps: true })
// export class Comment {
//   @Prop({ required: true })
//   userId: string;

//   @Prop({ required: true })
//   text: string;

//   @Prop({ default: Date.now })
//   createdAt: Date;
// }

// export const CommentSchema = SchemaFactory.createForClass(Comment);

// @Schema({ timestamps: true })
// export class Publication extends Document {
//   @Prop({ required: true })
//   title: string;

//   @Prop({ required: true })
//   description: string;

//   @Prop([{ url: String, type: { type: String, enum: ['image', 'video'] } }])
//   mediaItems: { url: string; type: string }[];

//   @Prop({ required: true })
//   providerId: string;

//   @Prop({ type: [String], default: [] })
//   likes: string[];

//   @Prop({ type: [CommentSchema], default: [] })
//   comments: Comment[];
// }

// export const PublicationSchema = SchemaFactory.createForClass(Publication);