// src/locations/locations.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LocationService } from './locations.service';
import { LocationController } from './locations.controller';
import { Location, LocationSchema } from './Location.schema'; // Add Location import

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Location.name, schema: LocationSchema }]),
  ],
  controllers: [LocationController],
  providers: [LocationService],
  exports: [LocationService] // This is crucial for sharing the service

})
export class LocationsModule {}