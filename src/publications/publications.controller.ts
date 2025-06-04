import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  HttpCode,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Req,
  Param,
  Body,
} from '@nestjs/common';
import { PublicationsService } from './publications.service';
import { Publication } from './publication.schema';
import { extname } from 'path';
import * as fs from 'fs';
import { FastifyRequest } from 'fastify';
import { existsSync, mkdirSync } from 'fs';

@Controller('publications')
export class PublicationsController {
  constructor(private readonly publicationsService: PublicationsService) {
    this.ensureUploadsDirectoryExists();
  }

  private ensureUploadsDirectoryExists() {
    const uploadPath = './uploads/publications';
    if (!existsSync(uploadPath)) {
      mkdirSync(uploadPath, { recursive: true });
    }
  }

  @Post()
  async create(@Req() request: FastifyRequest) {
    try {
      const uploadDir = './uploads/publications';
      const updateData: Record<string, any> = {};
      let imagePath: string | undefined;

      const isMultipart = await request.isMultipart();
      if (!isMultipart) {
        throw new BadRequestException('Request must be multipart/form-data');
      }

      const parts = request.parts();
      for await (const part of parts) {
        if (part.type === 'file' && part.fieldname === 'image') {
          if (!part.mimetype.match(/\/(jpg|jpeg|png)$/)) {
            throw new BadRequestException('Only jpg, jpeg, or png images are allowed');
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
          imagePath = `/uploads/publications/${filename}`;
        } else if (part.type === 'field' && part.fieldname) {
          updateData[part.fieldname] = part.value;
        }
      }

      const requiredFields = ['title', 'description', 'providerId'];
      for (const field of requiredFields) {
        if (!updateData[field]) {
          throw new BadRequestException(`${field} is required`);
        }
      }

      const publication = await this.publicationsService.create({
        title: updateData.title.toString(),
        description: updateData.description.toString(),
        providerId: updateData.providerId.toString(),
        picture: imagePath || '',
      });

      return {
        success: true,
        data: publication,
      };
    } catch (error) {
      console.error('Error in create:', error);
      throw error instanceof BadRequestException
        ? error
        : new BadRequestException('Failed to create publication');
    }
  }

  @Put(':id')
  async updateWithImage(@Param('id') id: string, @Req() request: FastifyRequest) {
    try {
      if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
        throw new BadRequestException('Invalid publication ID');
      }

      const existingPublication = await this.publicationsService.findById(id);
      if (!existingPublication) {
        throw new NotFoundException('Publication not found');
      }

      const uploadDir = './uploads/publications';
      const updateData: Record<string, any> = {};
      let imagePath: string | undefined;

      const isMultipart = await request.isMultipart();
      if (!isMultipart) {
        throw new BadRequestException('Request must be multipart/form-data');
      }

      const parts = request.parts();
      for await (const part of parts) {
        if (part.type === 'file' && part.fieldname === 'image') {
          if (!part.mimetype.match(/\/(jpg|jpeg|png)$/)) {
            throw new BadRequestException('Only jpg, jpeg, or png images are allowed');
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
          imagePath = `/uploads/publications/${filename}`;

          // Delete the old image if it exists
          if (existingPublication.picture && existsSync(`.${existingPublication.picture}`)) {
            try {
              fs.unlinkSync(`.${existingPublication.picture}`);
              console.log(`Deleted old image: ${existingPublication.picture}`);
            } catch (error) {
              console.error(`Failed to delete old image: ${existingPublication.picture}`, error);
            }
          }
        } else if (part.type === 'field' && part.fieldname) {
          updateData[part.fieldname] = part.value;
        }
      }

      const requiredFields = ['title', 'description', 'providerId'];
      for (const field of requiredFields) {
        if (!updateData[field]) {
          throw new BadRequestException(`${field} is required`);
        }
      }

      const updatePayload = {
        title: updateData.title.toString(),
        description: updateData.description.toString(),
        providerId: updateData.providerId.toString(),
        picture: imagePath || existingPublication.picture || '',
      };

      console.log('Updating publication ID:', id);
      console.log('Update payload:', updatePayload);

      const updatedPublication = await this.publicationsService.updatePublication(id, updatePayload);

      console.log('Updated publication:', updatedPublication);

      return {
        success: true,
        data: updatedPublication,
      };
    } catch (error) {
      console.error('Error in updateWithImage:', error);
      throw error instanceof BadRequestException || error instanceof NotFoundException
        ? error
        : new InternalServerErrorException('Failed to update publication');
    }
  }

  @Put(':id/text')
  async updateWithoutImage(
    @Param('id') id: string,
    @Body() body: { title: string; description: string; providerId: string },
  ) {
    try {
      if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
        throw new BadRequestException('Invalid publication ID');
      }

      const existingPublication = await this.publicationsService.findById(id);
      if (!existingPublication) {
        throw new NotFoundException('Publication not found');
      }

      const updateData = {
        title: body.title,
        description: body.description,
        providerId: body.providerId,
        picture: existingPublication.picture || '',
      };

      console.log('Updating publication ID (text):', id);
      console.log('Update payload (text):', updateData);

      const updatedPublication = await this.publicationsService.updatePublication(id, updateData);

      console.log('Updated publication (text):', updatedPublication);

      return {
        success: true,
        data: updatedPublication,
      };
    } catch (error) {
      console.error('Error in updateWithoutImage:', error);
      throw error instanceof BadRequestException || error instanceof NotFoundException
        ? error
        : new InternalServerErrorException('Failed to update publication');
    }
  }

  @Get()
  findAll(): Promise<Publication[]> {
    return this.publicationsService.findAll();
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.publicationsService.remove(id);
  }

  @Get('prestataire/:prestataireId')
  @HttpCode(200)
  async findByPrestataire(@Param('prestataireId') prestataireId: string) {
    const publications = await this.publicationsService.findByPrestataireId(prestataireId);
    return {
      success: true,
      message: 'Publications retrieved successfully',
      data: publications,
    };
  }

  @Post(':id/like')
  async toggleLike(@Param('id') id: string, @Body() body: { userId: string }) {
    return this.publicationsService.toggleLike(id, body.userId);
  }

  @Post(':id/comment')
  async addComment(
    @Param('id') id: string,
    @Body() body: { userId: string; text: string; userName?: string; userImageUrl?: string; userType?: string },
  ) {
    return this.publicationsService.addComment(id, body.userId, body.text);
  }

  @Put(':publicationId/comments/:commentId')
  async updateComment(
    @Param('publicationId') publicationId: string,
    @Param('commentId') commentId: string,
    @Body() updateCommentDto: { text: string },
  ) {
    return this.publicationsService.updateComment(publicationId, commentId, updateCommentDto.text);
  }

  @Delete(':publicationId/comments/:commentId')
  async deleteComment(@Param('publicationId') publicationId: string, @Param('commentId') commentId: string) {
    return this.publicationsService.deleteComment(publicationId, commentId);
  }
}