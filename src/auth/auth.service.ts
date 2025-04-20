import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Prestataire } from '../prestataires/prestataire.schema';
import { Client } from '../clients/client.schema';
import { VerificationCode } from 'src/verification-code.schema';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private transporter: nodemailer.Transporter;

  constructor(
    @InjectModel(Prestataire.name) private prestataireModel: Model<Prestataire>,
    @InjectModel(Client.name) private clientModel: Model<Client>,
    @InjectModel(VerificationCode.name) private verificationCodeModel: Model<VerificationCode>,
    private configService: ConfigService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_HOST'),
      port: this.configService.get<number>('EMAIL_PORT'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASS'),
      },
    });
  }

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
            businessAddress: prestataire.businessAddress,
            available: prestataire.available,
            minPrice: prestataire.minPrice,
            maxPrice: prestataire.maxPrice,
            business_id: prestataire.businessID,
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
          businessAddress: client.homeAddress,
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

  async signUp(data: any): Promise<{ message: string; user: Client | Prestataire }> {
    if (!data.userType || !['client', 'prestataire'].includes(data.userType)) {
      throw new BadRequestException('userType must be either "client" or "prestataire"');
    }

    if (!data.name || typeof data.name !== 'string') {
      throw new BadRequestException('Name is required and must be a string');
    }
    if (!data.email || typeof data.email !== 'string') {
      throw new BadRequestException('Email is required and must be a string');
    }
    if (!data.password || typeof data.password !== 'string') {
      throw new BadRequestException('Password is required and must be a string');
    }

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
      const existingPrestataire = await this.prestataireModel.findOne({
        $or: [{ email: data.email }, { businessID: data.businessID }],
      }).exec();
      if (existingPrestataire) {
        throw new ConflictException('Email or businessID already exists');
      }

      if (!data.category || typeof data.category !== 'string') {
        throw new BadRequestException('category is required and must be a string');
      }
      if (!data.businessAddress || typeof data.businessAddress !== 'string') {
        throw new BadRequestException('business Address is required and must be a string');
      }
      if (data.available !== undefined && typeof data.available !== 'boolean') {
        throw new BadRequestException('available must be a boolean');
      }

      const minPrice = typeof data.minPrice === 'string' ? parseFloat(data.minPrice) : data.minPrice;
      const maxPrice = typeof data.maxPrice === 'string' ? parseFloat(data.maxPrice) : data.maxPrice;

      if (!minPrice || typeof minPrice !== 'number' || isNaN(minPrice)) {
        throw new BadRequestException('minPrice is required and must be a number');
      }
      if (!maxPrice || typeof maxPrice !== 'number' || isNaN(maxPrice)) {
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

      const newPrestataire = new this.prestataireModel({
        name: data.name,
        email: data.email,
        password: hashedPassword,
        job: data.job,
        category: data.category,
        businessAddress: data.businessAddress,
        available: data.available !== undefined ? data.available : true,
        minPrice: minPrice,
        maxPrice: maxPrice,
        businessID: data.businessID,
        image: data.image || '',
        phoneNumber: data.phoneNumber || '',
        facebook: data.facebook || '',
        instagram: data.instagram || '',
        website: data.website || '',
      });

      const savedPrestataire = await newPrestataire.save();
      return { message: 'Prestataire registered successfully', user: savedPrestataire };
    }
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      console.log('Checking email:', email);
      const client = await this.clientModel.findOne({ email }).exec();
      const prestataire = await this.prestataireModel.findOne({ email }).exec();
  
      if (!client && !prestataire) {
        console.log('Email not found in database:', email);
        throw new BadRequestException('Email not found');
      }
  
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      console.log('Generated code:', code);
  
      await this.verificationCodeModel.deleteMany({ email }).exec();
      await this.verificationCodeModel.create({
        email,
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });
  
      await this.transporter.sendMail({
        from: `"TIKTAK" <${this.configService.get<string>('EMAIL_USER')}>`,
        to: email,
        subject: 'TIKTAK Password Reset Code',
        text: `Votre code de vérification est : ${code}\n\nCe code expire dans 10 minutes.`,
        html: `
          <h2>TIKTAK Password Reset</h2>
          <p>Votre code de vérification est : <strong>${code}</strong></p>
          <p>Ce code expire dans 10 minutes.</p>
          <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
        `,
      });
      console.log('Email sent to:', email);
  
      return { message: 'Verification code sent' };
    } catch (error) {
      console.error('Forgot password error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to process request');
    }
  }

  async verifyCode(email: string, code: string): Promise<{ message: string }> {
    try {
      const verification = await this.verificationCodeModel.findOne({ email, code }).exec();

      if (!verification) {
        throw new BadRequestException('Invalid or expired code');
      }

      await this.verificationCodeModel.deleteOne({ email, code }).exec();

      return { message: 'Code verified' };
    } catch (error) {
      console.error('Verify code error:', error);
      throw error instanceof BadRequestException ? error : new InternalServerErrorException('Failed to verify code');
    }
  }

  async resetPassword(email: string, newPassword: string): Promise<{ message: string }> {
    try {
      const client = await this.clientModel.findOne({ email }).exec();
      const prestataire = await this.prestataireModel.findOne({ email }).exec();

      if (!client && !prestataire) {
        throw new BadRequestException('Email not found');
      }

      if (newPassword.length < 6) {
        throw new BadRequestException('Password must be at least 6 characters');
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      if (client) {
        client.password = hashedPassword;
        await client.save();
        return { message: 'Password reset successful' };
      }

      if (prestataire) {
        prestataire.password = hashedPassword;
        await prestataire.save();
        return { message: 'Password reset successful' };
      }

      // This line should never be reached due to the earlier check, but added for TypeScript
      throw new InternalServerErrorException('Unexpected error during password reset');
    } catch (error) {
      console.error('Reset password error:', error);
      throw error instanceof BadRequestException ? error : new InternalServerErrorException('Failed to reset password');
    }
  }
}