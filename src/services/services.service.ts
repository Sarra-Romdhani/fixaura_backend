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
  async createService(
    title: string,
    description: string,
    price: number,
    estimatedDuration: number,
    photo: string,
    prestataireId: string,
  ) {
    try {
      // Validate price is positive
      if (price <= 0) {
        throw new Error('Price must be positive');
      }

      const newService = new this.serviceModel({
        title,
        description,
        price,
        estimatedDuration,
        photo,
        prestataireId,
      });

      const result = await newService.save();
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('Service creation failed:', error);
      throw error;
    }
  }
  // async addService(
  //   title: string,
  //   description: string,
  //   price: number,
  //   estimatedDuration: number,
  //   photo: string,
  //   prestataireId: string,
  // ): Promise<Service> {
  //   console.log('ID reçu dans la requête :', prestataireId);
  //   const prestataire = await this.prestataireModel.findOne({ _id: new Types.ObjectId(prestataireId) }).exec();
  //   console.log('Résultat de findOne :', prestataire);
  //   if (!prestataire) {
  //     throw new BadRequestException('prestataire not found');
  //   }
  //   const service = new this.serviceModel({
  //     title,
  //     description,
  //     price,
  //     estimatedDuration,
  //     photo,
  //     prestataireId, // Stocké comme string dans le service
  //   });
  //   return service.save();
  // }

  async updateService(
    id: string,
    title: string,
    description: string,
    price: number,
    estimatedDuration: number, // Changed to string to match your schema
    photo: string,
    prestataireId: string,
  ): Promise<Service> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid service ID format');
    }

    const existingService = await this.serviceModel.findById(id).exec();
    if (!existingService) {
      throw new NotFoundException('Service not found');
    }

    const prestataire = await this.prestataireModel.findById(prestataireId).exec();
    if (!prestataire) {
      throw new BadRequestException('Prestataire not found');
    }

    if (price <= 0) {
      throw new BadRequestException('Price must be positive');
    }



    existingService.title = title;
    existingService.description = description;
    existingService.price = price;
    existingService.estimatedDuration = estimatedDuration || existingService.estimatedDuration ;
    existingService.photo = photo || existingService.photo; // Keep old photo if none provided
    existingService.prestataireId = prestataireId;

    return existingService.save();
  }



  async deleteService(id: string): Promise<void> {
    const result = await this.serviceModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Service not found');
    }
  }



  // nestaamlouha bch njibou l service mta3 pres edheka bedhet fi profile pres
async getServicesByPrestataireId(prestataireId: string): Promise<Service[]> {
  // Validate the prestataireId format
  if (!Types.ObjectId.isValid(prestataireId)) {
    throw new BadRequestException('Invalid prestataire ID format');
  }

  // Check if prestataire exists
  const prestataire = await this.prestataireModel.findById(prestataireId).exec();
  if (!prestataire) {
    throw new NotFoundException('Prestataire not found');
  }

  // Find all services for this prestataire
  const services = await this.serviceModel.find({ prestataireId }).exec();
  
  return services;
}
}