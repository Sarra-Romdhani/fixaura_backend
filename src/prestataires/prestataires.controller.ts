import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Put, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { PrestatairesService } from './prestataires.service';
import { Prestataire } from './prestataire.schema';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import sharp from 'sharp';

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

@Get(':id/statistics')
async getBookingStatistics(@Param('id') id: string) {
  const statistics = await this.prestatairesService.getBookingStatistics(id);
  return {
    success: true,
    data: statistics,
  };
}

@Put(':id')
@UseInterceptors(FileInterceptor('image', {
  storage: diskStorage({
    destination: './uploads/profiles',
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const filename = `profile-${req.params.id}-${uniqueSuffix}${extname(file.originalname)}`;
      console.log('Saving file as:', filename);
      cb(null, filename);
    }
  }),
  fileFilter: (req, file, cb) => {
    console.log('File received:', file);
    if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
      console.log('Rejected file type:', file.mimetype);
      return cb(new BadRequestException('Seules les images (jpg, jpeg, png, gif) sont autorisées'), false);
    }
    cb(null, true);
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
}))
async updatePrestataire(
  @Param('id') id: string,
  @Body() body: any,
  @UploadedFile() file?: Express.Multer.File,
): Promise<Prestataire> {
  console.log('Update request received for ID:', id);
  console.log('Request body:', body);
  console.log('Uploaded file:', file ? file : 'No file uploaded');

  const updateData: Partial<Prestataire> = {
    name: body.name,
    job: body.job,
    phoneNumber: body.phoneNumber,
    businessAddress: body.businessAddress,
    facebook: body.facebook,
    instagram: body.instagram,
    website: body.website
  };

  try {
    if (file) {
      updateData.image = `/uploads/profiles/${file.filename}`;
      console.log('New image path set to:', updateData.image);
    } else {
      console.log('No file provided, keeping existing image or clearing if undefined');
    }

    const updated = await this.prestatairesService.updatePrestataire(id, updateData);
    if (!updated) {
      console.log('Update failed: Prestataire not found');
      throw new NotFoundException('Prestataire non trouvé après mise à jour');
    }
    console.log('Updated prestataire:', updated);
    return updated;
  } catch (error) {
    console.error('Detailed update error:', error.stack || error);
    throw error; // Let NestJS handle the exception properly
  }
}



// New endpoint to fetch all prestataires except the one with the given ID
@Get('exclude/:id')
async getAllPrestatairesExcept(@Param('id') id: string) {
  const prestataires = await this.prestatairesService.getAllPrestatairesExcept(id);
  return {
    success: true,
    data: prestataires,
  };
}



// New endpoint to fetch prestataires with different jobs
@Get('different-job/:id')
async getPrestatairesWithDifferentJob(@Param('id') id: string) {
  const prestataires = await this.prestatairesService.findPrestatairesWithDifferentJob(id);
  return {
    success: true,
    data: prestataires,
  };
}

// New endpoint to search prestataires with different jobs by name
@Get('different-job/:id/search')
async searchByNameWithDifferentJob(
  @Param('id') id: string,
  @Query('name') name?: string,
) {
  const prestataires = await this.prestatairesService.searchByNameWithDifferentJob(id, name);
  return {
    success: true,
    data: prestataires,
  };
}

}

