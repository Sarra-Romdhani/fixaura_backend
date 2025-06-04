import { BadRequestException, Controller, Get, NotFoundException, Param, Put, Query, Req } from '@nestjs/common';
import { PrestatairesService } from './prestataires.service';
import { Prestataire } from './prestataire.schema';
import { FastifyRequest } from 'fastify';
import { extname } from 'path';
import * as fs from 'fs';
import { Multipart } from '@fastify/multipart';

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

  @Get('top-rated/:category')
  async getTopRatedPrestatairesByJobInCategory(@Param('category') category: string) {
    const prestataires = await this.prestatairesService.getTopRatedPrestatairesByJobInCategory(category);
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
  async updatePrestataire(
    @Param('id') id: string,
    @Req() request: FastifyRequest,
  ): Promise<Prestataire> {
    console.log('Update request received for ID:', id);

    const updateData: Partial<Prestataire> = {};

    try {
      // Ensure the upload directory exists
      const uploadDir = './uploads/profiles';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Check if the request contains multipart data
      const isMultipart = await request.isMultipart();
      if (!isMultipart) {
        throw new BadRequestException('Request must be multipart/form-data');
      }

      // Collect form fields and files
      const parts = request.parts();
      for await (const part of parts) {
        if (part.type === 'file' && part.fieldname === 'image') {
          // Handle file part
          if (!part.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
            throw new BadRequestException('Seules les images (jpg, jpeg, png, gif) sont autorisées');
          }

          // Generate a unique filename
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const filename = `profile-${id}-${uniqueSuffix}${extname(part.filename)}`;
          const fileDestination = `${uploadDir}/${filename}`;

          // Save the file to disk
          await new Promise<void>((resolve, reject) => {
            const writeStream = fs.createWriteStream(fileDestination);
            part.file.pipe(writeStream);
            writeStream.on('finish', () => resolve());
            writeStream.on('error', reject);
          });

          // Set the image path for the update
          updateData.image = `/uploads/profiles/${filename}`;
          console.log('New image path set to:', updateData.image);
        } else if (part.type === 'field' && part.fieldname) {
          // Handle form field
          const value = part.value;
          if (value !== undefined) {
            switch (part.fieldname) {
              case 'name':
                updateData.name = value as string;
                break;
              case 'job':
                updateData.job = value as string;
                break;
              case 'phoneNumber':
                updateData.phoneNumber = value as string;
                break;
              case 'businessAddress':
                updateData.businessAddress = value as string;
                break;
              case 'facebook':
                updateData.facebook = value as string;
                break;
              case 'instagram':
                updateData.instagram = value as string;
                break;
              case 'website':
                updateData.website = value as string;
                break;
            }
          }
        }
      }

      console.log('Parsed update data:', updateData);

      // Validate required fields
      if (!updateData.name || !updateData.job || !updateData.businessAddress) {
        throw new BadRequestException('Name, job, and business address are required');
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
      throw error;
    }
  }

  @Get('exclude/:id')
  async getAllPrestatairesExcept(@Param('id') id: string) {
    const prestataires = await this.prestatairesService.getAllPrestatairesExcept(id);
    return {
      success: true,
      data: prestataires,
    };
  }

  @Get('different-job/:id')
  async getPrestatairesWithDifferentJob(@Param('id') id: string) {
    const prestataires = await this.prestatairesService.findPrestatairesWithDifferentJob(id);
    return {
      success: true,
      data: prestataires,
    };
  }

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