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
  // async searchPrestataires(
  //   name?: string,
  //   location?: string,
  //   available?: boolean,
  //   minPrice?: number,
  //   maxPrice?: number,
  //   category?: string,
  //   job?: string,
  // ): Promise<Prestataire[]> {
  //   const filter: any = {};

  //   if (name !== undefined) {
  //     filter.name = { $regex: new RegExp(name, 'i') };
  //   }
  //   if (location !== undefined) {
  //     filter.location = { $regex: new RegExp(location, 'i') };
  //   }
  //   if (available !== undefined) {
  //     filter.available = available;
  //   }
  //   if (category !== undefined) {
  //     filter.category = { $regex: new RegExp(category, 'i') };
  //   }
  //   if (job !== undefined) {
  //     filter.job = { $regex: new RegExp(job, 'i') };
  //   }

  //   if (minPrice !== undefined || maxPrice !== undefined) {
  //     if (minPrice !== undefined) {
  //       filter.minPrice = { $gte: minPrice };
  //     }
  //     if (maxPrice !== undefined) {
  //       filter.maxPrice = { $gte: maxPrice };
  //     }
  //   }

  //   console.log('Filtre appliqué :', JSON.stringify(filter, null, 2));
  //   const prestataires = await this.prestataireModel.find(filter).exec();
  //   return prestataires;
  // }
  //ba3ed ma na5tarou el dwer w nemchiww lel welcome  mta3 l client 
  async searchByCategory(category: string): Promise<Prestataire[]> {
    const filter = {
      category: { $regex: new RegExp(category, 'i') }
    };
    
    console.log('Filtre par catégorie :', JSON.stringify(filter, null, 2));
    const prestataires = await this.prestataireModel.find(filter).exec();
    return prestataires;
  }z

  // async findById(id: string): Promise<Prestataire | null> {
  //   return this.prestataireModel.findById(id).exec();
  // }

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
// async getBookingStatistics(id_prestataire: string): Promise<{ confirmed: number; pending: number }> {
//   // Get the start of the current week
//   const startOfWeek = new Date();
//   startOfWeek.setHours(0, 0, 0, 0);
//   startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Start from Sunday

//   // Count confirmed reservations for the week
//   const confirmed = await this.reservationModel
//     .countDocuments({
//       id_prestataire,
//       status: 'confirmed',
//       date: { $gte: startOfWeek }, // Reservations from the start of the week
//     })
//     .exec();

//   // Count pending reservations
//   const pending = await this.reservationModel
//     .countDocuments({
//       id_prestataire,
//       status: 'pending',
//     })
//     .exec();

//   return {
//     confirmed,
//     pending,
//   };
// }
async getBookingStatistics(id_prestataire: string): Promise<{ confirmed: number; pending: number }> {
  // Case-insensitive status matching
  const confirmedQuery = { 
    id_prestataire,
    status: { $regex: /^confirmed$/i }, // Case-insensitive match
};

  const pendingQuery = { 
    id_prestataire,
    status: { $regex: /^pending$/i } // Case-insensitive match
  };

  const [confirmed, pending] = await Promise.all([
    this.reservationModel.countDocuments(confirmedQuery),
    this.reservationModel.countDocuments(pendingQuery)
  ]);

  return { confirmed, pending };
}



// New method to update prestataire
// Dans prestataires.service.ts
async updatePrestataire(id: string, updateData: Partial<Prestataire>): Promise<Prestataire> {
  try {
    const updated = await this.prestataireModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).exec();

    if (!updated) {
      console.log(`Prestataire with ID ${id} not found in database`);
      throw new NotFoundException(`Prestataire ${id} non trouvé`);
    }
    
    console.log('Database update successful:', updated);
    return updated;
  } catch (error) {
    console.error('Database update error:', error.stack || error);
    throw error;
  }
}
async searchPrestataires(
  name?: string,
  location?: string,
  available?: boolean,
  minPrice?: number,
  maxPrice?: number,
  category?: string,
  job?: string,
  excludeId?: string,
): Promise<Prestataire[]> {
  const query: any = {};
  if (name) query.name = { $regex: name, $options: 'i' };
  if (location) query.businessAddress = { $regex: location, $options: 'i' };
  if (available !== undefined) query.available = available;
  if (minPrice) query.price = { $gte: minPrice };
  if (maxPrice) query.price = { ...query.price, $lte: maxPrice };
  if (category) query.category = category;
  if (job) query.job = job;
  if (excludeId) query._id = { $ne: excludeId };
  return this.prestataireModel.find(query).exec();
}

// prestataires.service.ts (assumed)
async findById(id: string): Promise<Prestataire> {
  const prestataire = await this.prestataireModel.findById(id).exec();
  if (!prestataire) {
    throw new NotFoundException(`Prestataire with ID ${id} not found`);
  }
  return prestataire;
}

//lele welcome page 
async getAllPrestatairesExcept(excludeId: string): Promise<Prestataire[]> {
  return this.prestataireModel.find({ _id: { $ne: excludeId } }).exec();
}

async getAllPrestataires(): Promise<Prestataire[]> {
  const prestataires = await this.prestataireModel.find().exec();
  return prestataires;
}

async getPrestataireByNameAndCategory(name: string, category?: string): Promise<Prestataire[]> {
  const filter: any = {};

  if (name) {
    filter.name = { $regex: new RegExp(name, 'i') }; // Case-insensitive partial match for name
  }
  if (category) {
    filter.category = { $regex: new RegExp(category, 'i') }; // Case-insensitive match for category
  }

  console.log('Filtre appliqué :', JSON.stringify(filter, null, 2));
  const prestataires = await this.prestataireModel.find(filter).exec();
  
  return prestataires;
}

async getPrestataireByJobAndName(job: string, name?: string): Promise<Prestataire[]> {
  const filter: any = {};

  // Job filter is mandatory
  filter.job = { $regex: new RegExp(job, 'i') }; // Case-insensitive match for job

  // Name filter is optional
  if (name) {
    filter.name = { $regex: new RegExp(name, 'i') }; // Case-insensitive partial match for name
  }

  console.log('Filtre appliqué (by job and name):', JSON.stringify(filter, null, 2));
  const prestataires = await this.prestataireModel.find(filter).exec();
  return prestataires;
}

async getPrestataireByJobAndPriceRange(job: string, maxPrice: number): Promise<Prestataire[]> {
  const filter: any = {};

  // Job filter is mandatory
  filter.job = { $regex: new RegExp(job, 'i') }; // Case-insensitive match for job

  // Price range filter: only check that the prestataire's maxPrice is <= the desired maxPrice
  filter.maxPrice = { $lte: maxPrice }; // Prestataire's maxPrice should be less than or equal to the desired maxPrice

  console.log('Filtre appliqué (by job and maxPrice):', JSON.stringify(filter, null, 2));
  const prestataires = await this.prestataireModel.find(filter).exec();
  return prestataires;
}















// New method to fetch prestataires with different jobs
async findPrestatairesWithDifferentJob(id: string): Promise<Prestataire[]> {
  // Step 1: Find the prestataire with the given ID
  const prestataire = await this.prestataireModel.findById(id).exec();
  if (!prestataire) {
    throw new NotFoundException(`Prestataire with ID ${id} not found`);
  }

  // Step 2: Retrieve all prestataires with a different job
  const job = prestataire.job;
  const prestataires = await this.prestataireModel
    .find({ job: { $ne: job }, _id: { $ne: id } }) // Exclude same job and same ID
    .exec();

  return prestataires;
}

// New method to search prestataires with different jobs by name
async searchByNameWithDifferentJob(id: string, name?: string): Promise<Prestataire[]> {
  // Step 1: Find the prestataire with the given ID
  const prestataire = await this.prestataireModel.findById(id).exec();
  if (!prestataire) {
    throw new NotFoundException(`Prestataire with ID ${id} not found`);
  }

  // Step 2: Build the filter
  const filter: any = {
    job: { $ne: prestataire.job }, // Different job
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








}