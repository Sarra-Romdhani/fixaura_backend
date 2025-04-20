import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { PrestatairesService } from './prestataires.service';
import { Prestataire } from './prestataire.schema';

@Controller('prestataires')
export class PrestatairesController {
  constructor(private readonly prestatairesService: PrestatairesService) {}

  @Get()
  async getAllPrestataires() {
    const prestataires = await this.prestatairesService.getAllPrestataires();
    return {
      success: true,
      data: prestataires,
    };
  }

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

  @Get('category/:category')
  async searchByCategoryParam(@Param('category') category: string) {
    const prestataires = await this.prestatairesService.searchByCategory(category);
    return {
      success: true,
      data: prestataires,
    };
  }

  @Get('by-name-and-category')
  async getPrestataireByNameAndCategory(
    @Query('name') name: string,
    @Query('category') category?: string,
  ) {
    const prestataires = await this.prestatairesService.getPrestataireByNameAndCategory(name, category);
    return {
      success: true,
      data: prestataires,
    };
  }

  @Get('by-job-and-name')
  async getPrestataireByJobAndName(
    @Query('job') job: string,
    @Query('name') name?: string,
  ) {
    if (!job) {
      throw new NotFoundException('Job parameter is required');
    }
    const prestataires = await this.prestatairesService.getPrestataireByJobAndName(job, name);
    return {
      success: true,
      data: prestataires,
    };
  }

  @Get('by-job-and-price-range')
  async getPrestataireByJobAndPriceRange(
    @Query('job') job: string,
    @Query('maxPrice') maxPrice: string,
  ) {
    if (!job) {
      throw new NotFoundException('Job parameter is required');
    }
    if (!maxPrice) {
      throw new NotFoundException('maxPrice parameter is required');
    }
    const prestataires = await this.prestatairesService.getPrestataireByJobAndPriceRange(
      job,
      parseInt(maxPrice),
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

  @Get('searchByCategory/:category')
  async searchByCategory(@Param('category') category: string): Promise<Prestataire[]> {
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