import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose'; // Ajoute Types ici
import { Service } from './service.schema';
import { Prestataire } from 'src/prestataires/prestataire.schema';

@Injectable()
export class ServicesService {
  constructor(
    @InjectModel('Service') private serviceModel: Model<Service>,
    @InjectModel('Prestataire') private prestataireModel: Model<Prestataire>,
  ) {
    console.log('Modèle Professional chargé :', this.prestataireModel.collection.name);
  }

  async addService(
    title: string,
    description: string,
    price: number,
    estimatedDuration: number,
    photo: string,
    prestataireId: string,
  ): Promise<Service> {
    console.log('ID reçu dans la requête :', prestataireId);
    const prestataire = await this.prestataireModel.findOne({ _id: new Types.ObjectId(prestataireId) }).exec();
    console.log('Résultat de findOne :', prestataire);
    if (!prestataire) {
      throw new BadRequestException('prestataire not found');
    }
    const service = new this.serviceModel({
      title,
      description,
      price,
      estimatedDuration,
      photo,
      prestataireId, // Stocké comme string dans le service
    });
    return service.save();
  }

  async updateService(
    id: string,
    title: string,
    description: string,
    price: number,
    estimatedDuration: number,
    photo: string,
    prestataireId: string,
  ): Promise<Service> {
    const existingService = await this.serviceModel.findById(id).exec();
    if (!existingService) {
      throw new NotFoundException('Service not found');
    }

    const prestataire = await this.prestataireModel.findOne({ _id: new Types.ObjectId(prestataireId) }).exec();
    if (!prestataire) {
      throw new BadRequestException('Professional not found');
    }

    existingService.title = title;
    existingService.description = description;
    existingService.price = price;
    existingService.estimatedDuration = estimatedDuration;
    existingService.photo = photo;
    existingService.prestataireId = prestataireId;

    return existingService.save();
  }

  async deleteService(id: string): Promise<void> {
    const result = await this.serviceModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Service not found');
    }
  }
}