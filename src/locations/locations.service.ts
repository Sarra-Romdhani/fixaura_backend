// src/location.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Server } from 'socket.io';
import { Location } from './Location.schema'; // Ensure this import is present
@Injectable()
export class LocationService {
  private io: Server | null = null;

  constructor(
    @InjectModel(Location.name) private locationModel: Model<Location>,
  ) {}

  setSocketIo(io: Server) {
    this.io = io;
  }

  async updateLocation(
    prestataireId: string,
    reservationId: string,
    coordinates: { lat: number; lng: number },
  ): Promise<Location> {
    if (!Types.ObjectId.isValid(prestataireId) || !reservationId) {
      throw new BadRequestException('Invalid prestataireId or reservationId');
    }
    if (isNaN(coordinates.lat) || isNaN(coordinates.lng)) {
      throw new BadRequestException('Invalid coordinates');
    }

    const location = await this.locationModel.create({
      prestataireId: new Types.ObjectId(prestataireId),
      reservationId,
      coordinates,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    if (this.io) {
      this.io.to(reservationId).emit('updateLocation', {
        prestataireId,
        reservationId,
        coordinates,
        timestamp: location.updatedAt,
      });
    }

    return location;
  }
  
  
  
  
  
  
  
  async getRouteHistory(reservationId: string): Promise<Location[]> { 
    return this.locationModel .find({ reservationId }) .sort({ createdAt: 1 }) .exec(); }
   
  
  
  
  
    async getLocation(reservationId: string): Promise<Location | null> { return this.locationModel.findOne({ reservationId }).exec(); }
  
  }

 
