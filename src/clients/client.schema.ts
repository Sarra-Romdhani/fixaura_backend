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

  @Prop()
  homeAddress: string;

  @Prop()
  image: string;

  @Prop()
  phoneNumber: string;
}

export const ClientSchema = SchemaFactory.createForClass(Client);