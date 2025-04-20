// src/services/services.controller.ts
import { Controller, Post, Put, Delete, Body, Param, HttpCode, Get, UseInterceptors, UploadedFile, BadRequestException, Req } from '@nestjs/common';
import { ServicesService } from './services.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {  // Ensure upload directory exists on startup
    this.ensureUploadsDirectoryExists();
  }

  private ensureUploadsDirectoryExists() {
    const uploadPath = './uploads/services';
    if (!existsSync(uploadPath)) {
      mkdirSync(uploadPath, { recursive: true });
    }
  }

  @Post('create')
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads/services',
      filename: (req, file, cb) => {
        try {
          const randomName = Array(32).fill(null).map(() => 
            Math.round(Math.random() * 16).toString(16)).join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        } catch (error) {
          cb(error, 'null');
        }
      }
    }),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    }
  }))
  async createService(
    @UploadedFile() image: Express.Multer.File,
    @Body() body: Record<string, any>
  ) {
    try {
      if (!image) {
        throw new BadRequestException('Image is required');
      }

      // Validate required fields
      const requiredFields = ['title', 'description', 'price', 'estimatedDuration', 'prestataireId'];
      for (const field of requiredFields) {
        if (!body[field]) {
          throw new BadRequestException(`${field} is required`);
        }
      }

      // Parse numeric fields
      const price = parseFloat(body.price);
      if (isNaN(price)) {
        throw new BadRequestException('Price must be a valid number');
      }

      const result = await this.servicesService.createService(
        body.title.toString(),
        body.description.toString(),
        price,
        body.estimatedDuration.toString(),
        `/uploads/services/${image.filename}`,
        body.prestataireId.toString()
      );

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error in createService:', error);
      throw new BadRequestException(error.message || 'Failed to create service');
    }
  }

// Add this to your existing controller
// @Post('create')
// @UseInterceptors(FileInterceptor('image', {
//   storage: diskStorage({
//     destination: './uploads/services',
//     filename: (req, file, cb) => {
//       const randomName = Array(32).fill(null).map(() => 
//         Math.round(Math.random() * 16).toString(16)).join('');
//       return cb(null, `${randomName}${extname(file.originalname)}`);
//     }
//   })
// }))
// async createService(
//   @UploadedFile() image: Express.Multer.File,
//   @Body() body: {
//     title: string;
//     description: string;
//     price: number;
//     estimatedDuration: number;
//     prestataireId: string;
//   }
// ) {
//   if (!image) {
//     throw new BadRequestException('Image is required');
//   }

//   const imageUrl = `/uploads/services/${image.filename}`;
  
//   return this.servicesService.addService(
//     body.title,
//     body.description,
//     body.price,
//     body.estimatedDuration,
//     imageUrl,
//     body.prestataireId,
//   );
// }



@Put('updateService/:id')
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads/services',
      filename: (req, file, cb) => {
        try {
          const randomName = Array(32).fill(null).map(() => 
            Math.round(Math.random() * 16).toString(16)).join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        } catch (error) {
          cb(error, 'null');
        }
      }
    }),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    }
  }))
  async updateService(
    @Param('id') id: string,
    @UploadedFile() image: Express.Multer.File,
    @Body() body: Record<string, any>
  ) {
    try {
      const requiredFields = ['title', 'description', 'price', 'estimatedDuration', 'prestataireId'];
      for (const field of requiredFields) {
        if (!body[field]) {
          throw new BadRequestException(`${field} is required`);
        }
      }

      const price = parseFloat(body.price);
      if (isNaN(price)) {
        throw new BadRequestException('Price must be a valid number');
      }

      // If an image is provided, use its path; otherwise, keep the existing photo
      const photo = image ? `/uploads/services/${image.filename}` : body.photo;

      const service = await this.servicesService.updateService(
        id,
        body.title.toString(),
        body.description.toString(),
        price,
        body.estimatedDuration.toString(),
        photo,
        body.prestataireId.toString()
      );

      return {
        success: true,
        message: 'Service updated successfully',
        data: service,
      };
    } catch (error) {
      console.error('Error in updateService:', error);
      throw new BadRequestException(error.message || 'Failed to update service');
    }
  }

  @Delete('deleteService/:id')
  @HttpCode(200)
  async deleteService(@Param('id') id: string) {
    await this.servicesService.deleteService(id);
    return {
      success: true,
      message: 'Service deleted successfully',
    };
  }

  @Get('getByPrestataire/:prestataireId')
  @HttpCode(200)
  async getServicesByPrestataire(@Param('prestataireId') prestataireId: string) {
    const services = await this.servicesService.getServicesByPrestataireId(prestataireId);
    return {
      success: true,
      message: 'Services retrieved successfully',
      data: services,
    };
  }
}