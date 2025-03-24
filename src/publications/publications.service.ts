import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Publication } from './publication.schema';

@Injectable()
export class PublicationsService {
  constructor(
    @InjectModel(Publication.name) private publicationModel: Model<Publication>,
  ) {}

  // Créer une nouvelle publication
  async create(data: any): Promise<Publication> {
    // Validation manuelle
    if (!data.title || typeof data.title !== 'string') {
      throw new BadRequestException('Title is required and must be a string');
    }
    if (!data.description || typeof data.description !== 'string') {
      throw new BadRequestException('Description is required and must be a string');
    }
    if (!data.providerId || typeof data.providerId !== 'string') {
      throw new BadRequestException('ProviderId is required and must be a string');
    }
    // Picture est optionnel, mais on vérifie que c'est une string si elle est fournie
    if (data.picture && typeof data.picture !== 'string') {
      throw new BadRequestException('Picture must be a string if provided');
    }

    const newPublication = new this.publicationModel({
      title: data.title,
      description: data.description,
      picture: data.picture || '', // Si picture n'est pas fourni, on met une chaîne vide
      providerId: data.providerId,
    });

    return newPublication.save();
  }

  // Récupérer toutes les publications
  async findAll(): Promise<Publication[]> {
    return this.publicationModel.find().exec();
  }

  // Récupérer une publication par ID
  async findOne(id: string): Promise<Publication> {
    if (!id || typeof id !== 'string') {
      throw new BadRequestException('ID must be a valid string');
    }
    const publication = await this.publicationModel.findById(id).exec();
    if (!publication) {
      throw new NotFoundException(`Publication with ID ${id} not found`);
    }
    return publication;
  }

  // Mettre à jour une publication
  async update(id: string, data: any): Promise<Publication> {
    if (!id || typeof id !== 'string') {
      throw new BadRequestException('ID must be a valid string');
    }

    // Validation manuelle des champs fournis
    const updateData: any = {};
    if (data.title) {
      if (typeof data.title !== 'string') {
        throw new BadRequestException('Title must be a string');
      }
      updateData.title = data.title;
    }
    if (data.description) {
      if (typeof data.description !== 'string') {
        throw new BadRequestException('Description must be a string');
      }
      updateData.description = data.description;
    }
    if (data.picture) {
      if (typeof data.picture !== 'string') {
        throw new BadRequestException('Picture must be a string');
      }
      updateData.picture = data.picture;
    }
    if (data.providerId) {
      if (typeof data.providerId !== 'string') {
        throw new BadRequestException('ProviderId must be a string');
      }
      updateData.providerId = data.providerId;
    }

    const updatedPublication = await this.publicationModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
    if (!updatedPublication) {
      throw new NotFoundException(`Publication with ID ${id} not found`);
    }
    return updatedPublication;
  }

  // Supprimer une publication
  async remove(id: string): Promise<void> {
    if (!id || typeof id !== 'string') {
      throw new BadRequestException('ID must be a valid string');
    }
    const result = await this.publicationModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Publication with ID ${id} not found`);
    }
  }
}