// src/professionals/professionals.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { ProfessionalsService } from './professionals.service';

@Controller('professionals')
export class ProfessionalsController {
  constructor(private readonly professionalsService: ProfessionalsService) {}

//   @Get('search')
//   async searchProfessionals(
//     @Query('name') name?: string,
//     @Query('location') location?: string,
//     @Query('available') available?: string, // "true" ou "false" comme chaîne
//     @Query('minPrice') minPrice?: string, // Converti en number
//     @Query('maxPrice') maxPrice?: string, // Converti en number
//   ) {
//     const availableBool = available === 'true' ? true : available === 'false' ? false : undefined;
//     const minPriceNum = minPrice ? parseFloat(minPrice) : undefined;
//     const maxPriceNum = maxPrice ? parseFloat(maxPrice) : undefined;

//     const professionals = await this.professionalsService.searchProfessionals(
//       name,
//       location,
//       availableBool,
//       minPriceNum,
//       maxPriceNum,
//     );

//     return {
//       success: true,
//       message: 'Professionals found',
//       data: professionals,
//       count: professionals.length,
//     };
//   }

@Get('search')
  async searchProfessionals(
    @Query('name') name?: string,
    @Query('location') location?: string,
    @Query('available') available?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
  ) {
    const availableBool = available === 'true' ? true : available === 'false' ? false : undefined;
    const minPriceNum = minPrice ? parseFloat(minPrice) : undefined;
    const maxPriceNum = maxPrice ? parseFloat(maxPrice) : undefined;

    const professionals = await this.professionalsService.searchProfessionals(
      name,
      location,
      availableBool,
      minPriceNum,
      maxPriceNum,
    );

    return {
      success: true,
      message: 'Professionals found',
      data: professionals,
      count: professionals.length,
    };
  }

  // Endpoint existant
  @Get(':id')
  async getProfessional(@Query('id') id: string) {
    const professional = await this.professionalsService.findById(id);
    return { success: true, data: professional };
  }
}