// src/points/points.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Points, PointsSchema } from './Point.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Points.name, schema: PointsSchema }]),
  ],
  exports: [MongooseModule], // Export so ReservationsModule can use Points model
})
export class PointsModule {}