import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Prestataire } from '../prestataires/prestataire.schema';
import { Client } from '../clients/client.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Prestataire.name) private prestataireModel: Model<Prestataire>,
    @InjectModel(Client.name) private clientModel: Model<Client>,
  ) {}

  async signIn(email: string, password: string): Promise<{ user: any; type: 'prestataire' | 'client' }> {
    console.log(`Attempting to sign in with email: ${email}`);
    console.log(`Provided password: ${password}`);

    const prestataire = await this.prestataireModel.findOne({ email }).exec();
    if (prestataire) {
      console.log('Prestataire found:', JSON.stringify(prestataire, null, 2));
      console.log('Stored prestataire password:', prestataire.password);
      const isPasswordValid = await bcrypt.compare(password, prestataire.password);
      console.log('Password valid for prestataire:', isPasswordValid);
      if (isPasswordValid) {
        return {
          user: {
            id: prestataire._id,
            name: prestataire.name,
            email: prestataire.email,
            job: prestataire.job,
            category: prestataire.category,
            location: prestataire.businessAddress,
            available: prestataire.available,
            minPrice: prestataire.minPrice,
            maxPrice: prestataire.maxPrice,
            business_id: prestataire.business_id,
            image: prestataire.image,
          },
          type: 'prestataire',
        };
      }
    } else {
      console.log('No prestataire found for email:', email);
    }

    const client = await this.clientModel.findOne({ email }).exec();
    if (client) {
      console.log('Client found:', JSON.stringify(client, null, 2));
      console.log('Stored client password:', client.password);
      const isPasswordValid = await bcrypt.compare(password, client.password);
      console.log('Password valid for client:', isPasswordValid);
      if (isPasswordValid) {
        return {
          user: {
            id: client._id,
            name: client.name,
            email: client.email,
            location: client.homeAddress,
          },
          type: 'client',
        };
      }
    } else {
      console.log('No client found for email:', email);
    }

    console.log('No user found or password invalid for email:', email);
    throw new UnauthorizedException('Invalid credentials');
  }
}
