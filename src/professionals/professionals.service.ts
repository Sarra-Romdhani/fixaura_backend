// src/professionals/professionals.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Professional } from './professional.schema';

@Injectable()
export class ProfessionalsService {
  constructor(
    @InjectModel('Professional') private professionalModel: Model<Professional>,
  ) {}

  // Recherche de professionnels avec plusieurs critères
//   async searchProfessionals(
//     name?: string,
//     location?: string,
//     available?: boolean,
//     minPrice?: number,
//     maxPrice?: number,
//   ): Promise<Professional[]> {
//     // Construire le filtre dynamiquement
//     const filter: any = {};

//     if (name) {
//       filter.name = { $regex: name, $options: 'i' }; // Recherche insensible à la casse
//     }
//     if (location) {
//       filter.location = { $regex: location, $options: 'i' }; // Recherche par localisation
//     }
//     if (available !== undefined) {
//       filter.available = available; // Filtrer par disponibilité
//     }
//     if (minPrice !== undefined) {
//       filter.maxPrice = { $gte: minPrice }; // maxPrice >= minPrice recherché
//     }
//     if (maxPrice !== undefined) {
//       filter.minPrice = { $lte: maxPrice }; // minPrice <= maxPrice recherché
//     }

//     // Exécuter la recherche
//     const professionals = await this.professionalModel.find(filter).exec();
//     return professionals;
//   }
async searchProfessionals(
    name?: string,
    location?: string,
    available?: boolean,
    minPrice?: number,
    maxPrice?: number,
  ): Promise<Professional[]> {
    const filter: any = {};

    if (name !== undefined) {
      filter.name = name; // Correspondance exacte
    }
    if (location !== undefined) {
      filter.location = location; // Correspondance exacte
    }
    if (available !== undefined) {
      filter.available = available; // Correspondance exacte
    }
    if (minPrice !== undefined) {
      filter.minPrice = { $gte: minPrice }; // Le minPrice du pro doit être >= au minPrice recherché
    }
    if (maxPrice !== undefined) {
      filter.maxPrice = { $lte: maxPrice }; // Le maxPrice du pro doit être <= au maxPrice recherché
    }

    console.log('Filtre appliqué :', filter); // Pour déboguer

    const professionals = await this.professionalModel.find(filter).exec();
    return professionals;
  }

  // Méthode existante pour trouver par ID (utile pour ServicesService)
  async findById(id: string): Promise<Professional | null> {
    return this.professionalModel.findById(id).exec();
  }
}