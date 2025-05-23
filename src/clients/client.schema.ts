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
}

export const ClientSchema = SchemaFactory.createForClass(Client);