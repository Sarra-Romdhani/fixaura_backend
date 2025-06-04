import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Prediction {
  @Prop({ required: true })
  status: string;

  @Prop({ required: true })
  confidence: number;

  @Prop()
  nextCheckDate: string;

  @Prop({ required: true })
  timestamp: string;
}

@Schema({ timestamps: true })
export class ApplianceApp extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  modele: string;

  @Prop({ required: true })
  brand: string;

  @Prop({ required: true })
  purchaseDate: string;

  @Prop({ default: 0 })
  breakdownCount: number;

  @Prop()
  lastBreakdownDate: string;

  @Prop()
  lastMaintenanceDate: string;

  @Prop()
  healthScore: number;

  @Prop()
  prediction: Prediction;

  @Prop([Prediction])
  history: Prediction[];

  @Prop()
  image: string;
}

export const ApplianceAppSchema = SchemaFactory.createForClass(ApplianceApp);