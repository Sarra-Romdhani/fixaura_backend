import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { PrestatairesService } from './prestataires.service';
import { Prestataire } from './prestataire.schema';

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
  async findById(@Param('id') id: string): Promise<Prestataire> {
    const prestataire = await this.prestatairesService.findById(id);
    if (!prestataire) {
      throw new NotFoundException(`Prestataire with ID ${id} not found`);
    }
    return prestataire;
  }
}
