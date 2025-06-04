import { BadRequestException, Controller, Post, Put, Delete, Param, HttpCode, Get, Req } from '@nestjs/common';
import { ServicesService } from './services.service';
import { FastifyRequest } from 'fastify';
import { extname } from 'path';
import * as fs from 'fs'; // Added import for fs
import { existsSync, mkdirSync } from 'fs';
import { Multipart } from '@fastify/multipart';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {
    // Ensure upload directory exists on startup
    this.ensureUploadsDirectoryExists();
  }

  private ensureUploadsDirectoryExists() {
    const uploadPath = './uploads/services';
    if (!existsSync(uploadPath)) {
      mkdirSync(uploadPath, { recursive: true });
    }
  }

  @Post('create')
  async createService(@Req() request: FastifyRequest) {
    try {
      const uploadDir = './uploads/services';
      const updateData: Record<string, any> = {};
      const isMultipart = await request.isMultipart();
      if (!isMultipart) {
        throw new BadRequestException('Request must be multipart/form-data');
      }
      const parts = request.parts();
      let imagePath: string | undefined;
      for await (const part of parts) {
        if (part.type === 'file' && part.fieldname === 'image') {
          if (!part.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
            throw new BadRequestException('Only jpg, jpeg, png, or gif images are allowed');
          }
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          const filename = `${randomName}${extname(part.filename)}`;
          const fileDestination = `${uploadDir}/${filename}`;
          await new Promise<void>((resolve, reject) => {
            const writeStream = fs.createWriteStream(fileDestination);
            part.file.pipe(writeStream);
            writeStream.on('finish', () => resolve());
            writeStream.on('error', reject);
          });
          imagePath = `/uploads/services/${filename}`;
        } else if (part.type === 'field' && part.fieldname) {
          updateData[part.fieldname] = part.value;
        }
      }
      const requiredFields = ['title', 'description', 'price', 'estimatedDuration', 'prestataireId'];
      for (const field of requiredFields) {
        if (!updateData[field]) {
          throw new BadRequestException(`${field} is required`);
        }
      }
      const price = parseFloat(updateData.price);
      if (isNaN(price)) {
        throw new BadRequestException('Price must be a valid number');
      }
      if (!imagePath) {
        throw new BadRequestException('Image is required');
      }
      const result = await this.servicesService.createService(
        updateData.title.toString(),
        updateData.description.toString(),
        price,
        updateData.estimatedDuration.toString(),
        imagePath,
        updateData.prestataireId.toString(),
      );
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('Error in createService:', error);
      throw new BadRequestException(error.message || 'Failed to create service');
    }
  }

  @Put('updateService/:id')
  async updateService(@Param('id') id: string, @Req() request: FastifyRequest) {
    try {
      const uploadDir = './uploads/services';
      const updateData: Record<string, any> = {};

      // Check if the request contains multipart data
      const isMultipart = await request.isMultipart();
      if (!isMultipart) {
        throw new BadRequestException('Request must be multipart/form-data');
      }

      // Collect form fields and files
      const parts = request.parts();
      let imagePath: string | undefined;
      for await (const part of parts) {
        if (part.type === 'file' && part.fieldname === 'image') {
          // Validate file type
          if (!part.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
            throw new BadRequestException('Only jpg, jpeg, png, or gif images are allowed');
          }

          // Generate a unique filename
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          const filename = `${randomName}${extname(part.filename)}`;
          const fileDestination = `${uploadDir}/${filename}`;

          // Save the file to disk
          await new Promise<void>((resolve, reject) => {
            const writeStream = fs.createWriteStream(fileDestination);
            part.file.pipe(writeStream);
            writeStream.on('finish', () => resolve());
            writeStream.on('error', reject);
          });

          imagePath = `/uploads/services/${filename}`;
        } else if (part.type === 'field' && part.fieldname) {
          updateData[part.fieldname] = part.value;
        }
      }

      // Validate required fields
      const requiredFields = ['title', 'description', 'price', 'estimatedDuration', 'prestataireId'];
      for (const field of requiredFields) {
        if (!updateData[field]) {
          throw new BadRequestException(`${field} is required`);
        }
      }

      // Parse numeric fields
      const price = parseFloat(updateData.price);
      if (isNaN(price)) {
        throw new BadRequestException('Price must be a valid number');
      }

      // Use new image if provided, otherwise keep existing photo
      const photo = imagePath || updateData.photo;

      const service = await this.servicesService.updateService(
        id,
        updateData.title.toString(),
        updateData.description.toString(),
        price,
        updateData.estimatedDuration.toString(),
        photo,
        updateData.prestataireId.toString(),
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