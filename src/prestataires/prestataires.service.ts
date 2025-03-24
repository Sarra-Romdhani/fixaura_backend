import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Prestataire } from './prestataire.schema';
import { Reservation } from 'src/reservations/reservation.schema';

@Injectable()
export class PrestatairesService {
  constructor(
    @InjectModel('Prestataire') private prestataireModel: Model<Prestataire>,
    @InjectModel('Reservation') private reservationModel: Model<Reservation>, // Inject Reservation model

  ) {}
//recherche prestataire 
  async searchPrestataires(
    name?: string,
    location?: string,
    available?: boolean,
    minPrice?: number,
    maxPrice?: number,
    category?: string,
    job?: string,
  ): Promise<Prestataire[]> {
    const filter: any = {};

    if (name !== undefined) {
      filter.name = { $regex: new RegExp(name, 'i') };
    }
    if (location !== undefined) {
      filter.location = { $regex: new RegExp(location, 'i') };
    }
    if (available !== undefined) {
      filter.available = available;
    }
    if (category !== undefined) {
      filter.category = { $regex: new RegExp(category, 'i') };
    }
    if (job !== undefined) {
      filter.job = { $regex: new RegExp(job, 'i') };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      if (minPrice !== undefined) {
        filter.minPrice = { $gte: minPrice };
      }
      if (maxPrice !== undefined) {
        filter.maxPrice = { $gte: maxPrice };
      }
    }

    console.log('Filtre appliqué :', JSON.stringify(filter, null, 2));
    const prestataires = await this.prestataireModel.find(filter).exec();
    return prestataires;
  }
  //ba3ed ma na5tarou el dwer w nemchiww lel welcome  mta3 l client 
  async searchByCategory(category: string): Promise<Prestataire[]> {
    const filter = {
      category: { $regex: new RegExp(category, 'i') }
    };
    
    console.log('Filtre par catégorie :', JSON.stringify(filter, null, 2));
    const prestataires = await this.prestataireModel.find(filter).exec();
    return prestataires;
  }

  async findById(id: string): Promise<Prestataire | null> {
    return this.prestataireModel.findById(id).exec();
  }

//lele welcom page mta3 prestataire 
async findPrestatairesWithSameJob(id: string): Promise<Prestataire[]> {
  // Step 1: Find the prestataire with the given ID
  const prestataire = await this.prestataireModel.findById(id).exec();

  if (!prestataire) {
    throw new Error('Prestataire not found');
  }

  // Step 2: Retrieve all prestataires with the same job, excluding the one with the given ID
  const job = prestataire.job;
  const prestataires = await this.prestataireModel
    .find({ job, _id: { $ne: id } }) // Exclude the prestataire with the same ID
    .exec();

  return prestataires;
}

//le recherche mta3 prestataire fel welcome page
async searchByNameAndSameJob(id: string, name?: string): Promise<Prestataire[]> {
  // Step 1: Find the prestataire with the given ID
  const prestataire = await this.prestataireModel.findById(id).exec();

  if (!prestataire) {
    throw new Error('Prestataire not found');
  }

  // Step 2: Build the filter
  const filter: any = {
    job: prestataire.job, // Same job
    _id: { $ne: id }, // Exclude the prestataire with the same ID
  };

  // Step 3: Add name filter if provided
  if (name) {
    filter.name = { $regex: new RegExp(name, 'i') }; // Case-insensitive search
  }

  // Step 4: Retrieve the prestataires
  const prestataires = await this.prestataireModel.find(filter).exec();

  return prestataires;
}

// hedha l statictiques li fi welcomepage prestataire
async getBookingStatistics(id_prestataire: string): Promise<{ confirmed: number; pending: number }> {
  // Get the start of the current week
  const startOfWeek = new Date();
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Start from Sunday

  // Count confirmed reservations for the week
  const confirmed = await this.reservationModel
    .countDocuments({
      id_prestataire,
      status: 'confirmed',
      date: { $gte: startOfWeek }, // Reservations from the start of the week
    })
    .exec();

  // Count pending reservations
  const pending = await this.reservationModel
    .countDocuments({
      id_prestataire,
      status: 'pending',
    })
    .exec();

  return {
    confirmed,
    pending,
  };
}





}