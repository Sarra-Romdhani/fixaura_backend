import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Client } from '../clients/client.schema';
import { Prestataire } from '../prestataires/prestataire.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Client.name) private clientModel: Model<Client>,
    @InjectModel(Prestataire.name) private prestataireModel: Model<Prestataire>,
  ) {}

  async signUp(data: any): Promise<{ message: string; user: Client | Prestataire }> {
    // Validation manuelle du type d'utilisateur
    if (!data.userType || !['client', 'prestataire'].includes(data.userType)) {
      throw new BadRequestException('userType must be either "client" or "prestataire"');
    }

    // Validation des champs communs obligatoires
    if (!data.name || typeof data.name !== 'string') {
      throw new BadRequestException('Name is required and must be a string');
    }
    if (!data.email || typeof data.email !== 'string') {
      throw new BadRequestException('Email is required and must be a string');
    }
    if (!data.password || typeof data.password !== 'string') {
      throw new BadRequestException('Password is required and must be a string');
    }

    // Hacher le mot de passe
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    if (data.userType === 'client') {
      const existingClient = await this.clientModel.findOne({ email: data.email }).exec();
      if (existingClient) {
        throw new ConflictException('Email already exists');
      }

      if (data.homeAddress && typeof data.homeAddress !== 'string') {
        throw new BadRequestException('homeAddress must be a string');
      }
      if (data.image && typeof data.image !== 'string') {
        throw new BadRequestException('image must be a string');
      }
      if (data.phoneNumber && typeof data.phoneNumber !== 'string') {
        throw new BadRequestException('phoneNumber must be a string');
      }

      const newClient = new this.clientModel({
        name: data.name,
        email: data.email,
        password: hashedPassword,
        homeAddress: data.homeAddress || '',
        image: data.image || '',
        phoneNumber: data.phoneNumber || '',
      });

      const savedClient = await newClient.save();
      return { message: 'Client registered successfully', user: savedClient };
    } else {
      // Puisque userType est validé comme "client" ou "prestataire", ceci couvre "prestataire"
      const existingPrestataire = await this.prestataireModel.findOne({
        $or: [{ email: data.email }, { businessID: data.businessID }],
      }).exec();
      if (existingPrestataire) {
        throw new ConflictException('Email or businessID already exists');
      }

      if (!data.category || typeof data.category !== 'string') {
        throw new BadRequestException('category is required and must be a string');
      }
      if (!data.location || typeof data.location !== 'string') {
        throw new BadRequestException('location is required and must be a string');
      }
      if (data.available !== undefined && typeof data.available !== 'boolean') {
        throw new BadRequestException('available must be a boolean');
      }
      if (!data.minPrice || typeof data.minPrice !== 'number') {
        throw new BadRequestException('minPrice is required and must be a number');
      }
      if (!data.maxPrice || typeof data.maxPrice !== 'number') {
        throw new BadRequestException('maxPrice is required and must be a number');
      }
      if (!data.businessID || typeof data.businessID !== 'string') {
        throw new BadRequestException('businessID is required and must be a string');
      }

      if (data.image && typeof data.image !== 'string') {
        throw new BadRequestException('image must be a string');
      }
      if (data.phoneNumber && typeof data.phoneNumber !== 'string') {
        throw new BadRequestException('phoneNumber must be a string');
      }
      if (data.facebook && typeof data.facebook !== 'string') {
        throw new BadRequestException('facebook must be a string');
      }
      if (data.instagram && typeof data.instagram !== 'string') {
        throw new BadRequestException('instagram must be a string');
      }
      if (data.website && typeof data.website !== 'string') {
        throw new BadRequestException('website must be a string');
      }
      if (data.serviceName && typeof data.serviceName !== 'string') {
        throw new BadRequestException('serviceName must be a string');
      }

      const newPrestataire = new this.prestataireModel({
        name: data.name,
        email: data.email,
        password: hashedPassword,
        category: data.category,
        location: data.location,
        available: data.available !== undefined ? data.available : true,
        minPrice: data.minPrice,
        maxPrice: data.maxPrice,
        businessID: data.businessID,
        image: data.image || '',
        phoneNumber: data.phoneNumber || '',
        facebook: data.facebook || '',
        instagram: data.instagram || '',
        website: data.website || '',
        serviceName: data.serviceName || '',
      });

      const savedPrestataire = await newPrestataire.save();
      return { message: 'Prestataire registered successfully', user: savedPrestataire };
    }
  }
}