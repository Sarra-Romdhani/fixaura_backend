// src/locations/locations.controller.ts
import { Controller, Get, Param } from '@nestjs/common';
import { LocationService } from './locations.service';

@Controller('locations')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get('history/:reservationId') async getRouteHistory(@Param('reservationId') reservationId: string) { const history = await this.locationService.getRouteHistory(reservationId); return { data: history }; }



  @Get(':reservationId') async getLocation(@Param('reservationId') reservationId: string) { const location = await this.locationService.getLocation(reservationId); return { data: location }; }
}