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
    @Query('category') category?: string,
    @Query('job') job?: string,
  ) {
    const prestataires = await this.prestatairesService.searchPrestataires(
      name,
      location,
      available === 'true' ? true : available === 'false' ? false : undefined,
      minPrice ? parseInt(minPrice) : undefined,
      maxPrice ? parseInt(maxPrice) : undefined,
      category,
      job,
    );
    return {
      success: true,
      data: prestataires,
    };
  }

  // New endpoint for category search
  @Get('category')
  async async 
  (@Query('category') category: string) {
    const prestataires = await this.prestatairesService.searchByCategory(category);
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

  // Dans PrestatairesController
  @Get(':id/same-job')
  async getPrestatairesWithSameJob(@Param('id') id: string) {
    const prestataires = await this.prestatairesService.findPrestatairesWithSameJob(id);
    return {
      success: true,
      data: prestataires,
    };
  }


  @Get(':id/same-job/search')
async searchByNameAndSameJob(
  @Param('id') id: string,
  @Query('name') name?: string,
) {
  const prestataires = await this.prestatairesService.searchByNameAndSameJob(id, name);
  return {
    success: true,
    data: prestataires,
  };
}
@Get('searchByCategory')
async searchByCategory(@Query('category') category: string): Promise<Prestataire[]> {
  return this.prestatairesService.searchByCategory(category);
}

@Get(':id/statistics')
async getBookingStatistics(@Param('id') id: string) {
  const statistics = await this.prestatairesService.getBookingStatistics(id);
  return {
    success: true,
    data: statistics,
  };
}
}