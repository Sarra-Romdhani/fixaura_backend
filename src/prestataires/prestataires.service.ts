import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Prestataire } from './prestataire.schema';

@Injectable()
export class PrestatairesService {
  constructor(
    @InjectModel('Prestataire') private prestataireModel: Model<Prestataire>,
  ) {}

  async searchPrestataires(
    name?: string,
    location?: string,
    available?: boolean,
    minPrice?: number,
    maxPrice?: number,
  ): Promise<Prestataire[]> {
    const filter: any = {};

    // Critères simples
    if (name !== undefined) {
      filter.name = { $regex: new RegExp(name, 'i') };
    }
    if (location !== undefined) {
      filter.location = { $regex: new RegExp(location, 'i') };
    }
    if (available !== undefined) {
      filter.available = available;
    }

    // Gestion de l’intervalle de prix
    if (minPrice !== undefined || maxPrice !== undefined) {
      if (minPrice !== undefined) {
        filter.minPrice = { $gte: minPrice }; // minPrice prestataire >= minPrice recherché
      }
      if (maxPrice !== undefined) {
        filter.maxPrice = { $gte: maxPrice }; // maxPrice prestataire >= maxPrice recherché
      }
    }

    console.log('Filtre appliqué :', JSON.stringify(filter, null, 2));
    const prestataires = await this.prestataireModel.find(filter).exec();
    return prestataires;
  }

  async findById(id: string): Promise<Prestataire | null> {
    return this.prestataireModel.findById(id).exec();
  }
}