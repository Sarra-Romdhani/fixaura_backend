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
import * as fs from 'fs/promises';
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
      const imagePaths: string[] = [];

      const isMultipart = await request.isMultipart();
      if (!isMultipart) {
        throw new BadRequestException('Request must be multipart/form-data');
      }

      const parts = request.parts();
      for await (const part of parts) {
        if (part.type === 'file' && part.fieldname === 'images') {
          if (!part.mimetype.match(/\/(jpg|jpeg|png)$/)) {
            throw new BadRequestException('Only jpg, jpeg, or png images are allowed');
          }
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          const filename = `${randomName}${extname(part.filename)}`;
          const fileDestination = `${uploadDir}/${filename}`;
          await fs.writeFile(fileDestination, part.file);
          imagePaths.push(`/uploads/publications/${filename}`);
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

      if (imagePaths.length > 10) {
        throw new BadRequestException('Cannot upload more than 10 images');
      }

      const publication = await this.publicationsService.create({
        title: updateData.title.toString(),
        description: updateData.description.toString(),
        providerId: updateData.providerId.toString(),
        pictures: imagePaths,
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
      const newImagePaths: string[] = [];
      let existingImages: string[] = [];

      const isMultipart = await request.isMultipart();
      if (!isMultipart) {
        throw new BadRequestException('Request must be multipart/form-data');
      }

      const parts = request.parts();
      for await (const part of parts) {
        if (part.type === 'file' && part.fieldname === 'images') {
          if (!part.mimetype.match(/\/(jpg|jpeg|png)$/)) {
            throw new BadRequestException('Only jpg, jpeg, or png images are allowed');
          }
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          const filename = `${randomName}${extname(part.filename)}`;
          const fileDestination = `${uploadDir}/${filename}`;
          await fs.writeFile(fileDestination, part.file);
          newImagePaths.push(`/uploads/publications/${filename}`);
        } else if (part.type === 'field' && part.fieldname) {
          updateData[part.fieldname] = part.value;
        }
      }

      if (updateData.existingImages) {
        try {
          existingImages = JSON.parse(updateData.existingImages);
          if (!Array.isArray(existingImages)) {
            throw new BadRequestException('existingImages must be an array');
          }
          existingImages = existingImages.filter((path: string) =>
            existingPublication.pictures?.includes(path),
          );
        } catch (e) {
          throw new BadRequestException('Invalid existingImages format');
        }
      }

      const requiredFields = ['title', 'description', 'providerId'];
      for (const field of requiredFields) {
        if (!updateData[field]) {
          throw new BadRequestException(`${field} is required`);
        }
      }

      if (existingPublication.pictures && existingPublication.pictures.length > 0) {
        const imagesToDelete = existingPublication.pictures.filter(
          (oldPath) => !existingImages.includes(oldPath),
        );
        for (const imagePath of imagesToDelete) {
          const filePath = `.${imagePath}`;
          if (existsSync(filePath)) {
            try {
              await fs.unlink(filePath);
              console.log(`Deleted image: ${imagePath}`);
            } catch (error) {
              console.error(`Failed to delete image: ${imagePath}`, error);
            }
          }
        }
      }

      const finalPictures = [...existingImages, ...newImagePaths];

      if (finalPictures.length > 10) {
        throw new BadRequestException('Total images cannot exceed 10');
      }

      const updatePayload = {
        title: updateData.title.toString(),
        description: updateData.description.toString(),
        providerId: updateData.providerId.toString(),
        pictures: finalPictures,
        updatedAt: new Date(),
      };

      const updatedPublication = await this.publicationsService.updatePublication(id, updatePayload);

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
    @Body() body: { title: string; description: string; providerId: string; pictures?: string[] },
  ) {
    try {
      if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
        throw new BadRequestException('Invalid publication ID');
      }

      if (!body || Object.keys(body).length === 0) {
        throw new BadRequestException('Request body cannot be empty');
      }

      const existingPublication = await this.publicationsService.findById(id);
      if (!existingPublication) {
        throw new NotFoundException('Publication not found');
      }

      const requiredFields = ['title', 'description', 'providerId'];
      for (const field of requiredFields) {
        if (!body[field]) {
          throw new BadRequestException(`${field} is required`);
        }
      }

      const updateData = {
        title: body.title,
        description: body.description,
        providerId: body.providerId,
        pictures: body.pictures || existingPublication.pictures || [],
        updatedAt: new Date(),
      };

      const updatedPublication = await this.publicationsService.updatePublication(id, updateData);

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
  async findAll(): Promise<Publication[]> {
    return this.publicationsService.findAll();
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    try {
      if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
        throw new BadRequestException('Invalid publication ID');
      }

      const publication = await this.publicationsService.findById(id);
      if (!publication) {
        throw new NotFoundException('Publication not found');
      }

      if (publication.pictures && publication.pictures.length > 0) {
        for (const imagePath of publication.pictures) {
          const filePath = `.${imagePath}`;
          if (existsSync(filePath)) {
            try {
              await fs.unlink(filePath);
              console.log(`Deleted image: ${imagePath}`);
            } catch (error) {
              console.error(`Failed to delete image: ${imagePath}`, error);
            }
          }
        }
      }

      await this.publicationsService.remove(id);
      console.log(`Successfully deleted publication: ${id}`);
    } catch (error) {
      console.error('Error in remove:', error);
      throw error instanceof BadRequestException || error instanceof NotFoundException
        ? error
        : new InternalServerErrorException(`Failed to delete publication: ${error.message}`);
    }
  }

  @Get('prestataire/:prestataireId')
  @HttpCode(200)
  async findByPrestataire(@Param('prestataireId') prestataireId: string) {
    if (!/^[0-9a-fA-F]{24}$/.test(prestataireId)) {
      throw new BadRequestException('Invalid prestataire ID');
    }
    const publications = await this.publicationsService.findByPrestataireId(prestataireId);
    return {
      success: true,
      message: 'Publications retrieved successfully',
      data: publications,
    };
  }

  @Post(':id/like')
  async toggleLike(@Param('id') id: string, @Body() body: { userId: string }) {
    try {
      if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
        throw new BadRequestException('Invalid publication ID');
      }
      if (!body || !body.userId) {
        throw new BadRequestException('userId is required in request body');
      }
      const result = await this.publicationsService.toggleLike(id, body.userId);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('Error in toggleLike:', error);
      throw error instanceof BadRequestException || error instanceof NotFoundException
        ? error
        : new InternalServerErrorException('Failed to toggle like');
    }
  }

  // @Post(':id/comment')
  // async addComment(
  //   @Param('id') id: string,
  //   @Body() body: { userId: string; text: string; userName?: string; userImageUrl?: string; userType?: string },
  // ) {
  //   try {
  //     if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
  //       throw new BadRequestException('Invalid publication ID');
  //     }
  //     if (!body || !body.userId || !body.text) {
  //       throw new BadRequestException('userId and text are required in request body');
  //     }
  //     const result = await this.publicationsService.addComment(id, body.userId, body.text);
  //     return {
  //       success: true,
  //       data: result,
  //     };
  //   } catch (error) {
  //     console.error('Error in addComment:', error);
  //     throw error instanceof BadRequestException || error instanceof NotFoundException
  //       ? error
  //       : new InternalServerErrorException('Failed to add comment');
  //   }
  // }
   @Post(':id/comment')
  async addComment(
    @Param('id') id: string,
    @Body() body: { userId: string; text: string; userName?: string; userImageUrl?: string; userType?: string },
  ) {
    try {
      if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
        throw new BadRequestException('Invalid publication ID');
      }
      if (!body || !body.userId || !body.text) {
        throw new BadRequestException('userId and text are required in request body');
      }
      const result = await this.publicationsService.addComment(id, body.userId, body.text);
      return {
        message: 'Commentaire ajouté avec succès',
        data: result,
      };
    } catch (error) {
      console.error('Error in addComment:', error);
      throw error instanceof BadRequestException || error instanceof NotFoundException
        ? error
        : new InternalServerErrorException('Failed to add comment');
    }
  }

  @Put(':publicationId/comments/:id')
  async updateComment(
    @Param('publicationId') publicationId: string,
    @Param('id') commentId: string,
    @Body() { text }: { text: string },
  ) {
    try {
      if (!/^[0-9a-fA-F]{24}$/.test(publicationId) || !/^[0-9a-fA-F]{24}$/.test(commentId)) {
        throw new BadRequestException('Invalid ID format');
      }
      if (!text) {
        throw new BadRequestException('Comment text is required in request body');
      }
      const result = await this.publicationsService.updateComment(publicationId, commentId, text);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('Error in updateComment:', error);
      throw error instanceof BadRequestException || error instanceof NotFoundException
        ? error
        : new InternalServerErrorException('Failed to update comment');
    }
  }

  @Delete(':publicationId/comments/:commentId')
  async deleteComment(
    @Param('publicationId') publicationId: string,
    @Param('commentId') commentId: string,
  ) {
    try {
      if (!/^[0-9a-fA-F]{24}$/.test(publicationId) || !/^[0-9a-fA-F]{24}$/.test(commentId)) {
        throw new BadRequestException('Invalid ID format');
      }
      const result = await this.publicationsService.deleteComment(publicationId, commentId);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('Error in deleteComment:', error);
      throw error instanceof BadRequestException || error instanceof NotFoundException
        ? error
        : new InternalServerErrorException('Failed to delete comment');
    }
  }
}