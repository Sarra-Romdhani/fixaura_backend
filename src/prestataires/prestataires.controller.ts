import { Controller, Get, Query } from '@nestjs/common';
import { PrestatairesService } from './prestataires.service';

@Controller('prestataires')
export class PrestatairesController {
  constructor(private readonly prestatairesService: PrestatairesService) {}

  @Get('search')
  async searchPrestataires(
    @Query('name') name?: string,
    @Query('location') location?: string,
    @Query('available') available?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
  ) {
    const prestataires = await this.prestatairesService.searchPrestataires(
      name,
      location,
      available === 'true' ? true : available === 'false' ? false : undefined,
      minPrice ? parseInt(minPrice) : undefined,
      maxPrice ? parseInt(maxPrice) : undefined,
    );
    return {
      success: true,
      data: prestataires,
    };
  }

  @Get(':id')
  async getPrestataire(@Query('id') id: string) {
    const prestataire = await this.prestatairesService.findById(id);
    return { success: true, data: prestataire };
  }
}
