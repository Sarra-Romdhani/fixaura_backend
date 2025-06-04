import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Client } from './client.schema';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class ClientsService {
  constructor(
    @InjectModel(Client.name) private clientModel: Model<Client>,
  ) {}

  async getClientProfile(id: string): Promise<Partial<Client>> {
    const client = await this.clientModel.findById(id).exec();
    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }
    // Exclude password and return only the fields we want
    const { password, ...clientWithoutPassword } = client.toObject();
    return {
      _id: clientWithoutPassword._id,
      name: clientWithoutPassword.name,
      email: clientWithoutPassword.email,
      homeAddress: clientWithoutPassword.homeAddress,
      image: clientWithoutPassword.image,
      phoneNumber: clientWithoutPassword.phoneNumber,
    };
  }

  async updateClient(id: string, updateData: Partial<Client>, file?: any): Promise<Partial<Client>> {
    const client = await this.clientModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }

    // Handle image upload if present
    if (file) {
      const uploadDir = path.join(__dirname, '../../Uploads/clients', id);
      await fs.mkdir(uploadDir, { recursive: true });

      const imagePath = path.join(uploadDir, `${Date.now()}_${file.filename}`);
      const writeStream = (await fs.open(imagePath, 'w')).createWriteStream();
      await new Promise<void>((resolve, reject) => {
        file.file.pipe(writeStream);
        writeStream.on('finish', () => resolve());
        writeStream.on('error', (error) => reject(error));
      });

      client.image = `/uploads/clients/${id}/${path.basename(imagePath)}`;
      await client.save();
    }

    // Exclude password and return only the fields we want
    const { password, ...clientWithoutPassword } = client.toObject();
    return {
      _id: clientWithoutPassword._id,
      name: clientWithoutPassword.name,
      email: clientWithoutPassword.email,
      homeAddress: clientWithoutPassword.homeAddress,
      image: clientWithoutPassword.image,
      phoneNumber: clientWithoutPassword.phoneNumber,
    };
  }
  
  async searchClients(query: string, excludeId: string): Promise<Client[]> {
    return this.clientModel.find({
      name: { $regex: query, $options: 'i' },
      _id: { $ne: excludeId }
    }).exec();
  }
  
  async updateClientPassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
    const client = await this.clientModel.findById(id).exec();
    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, client.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await this.clientModel.findByIdAndUpdate(id, { password: hashedNewPassword }).exec();
  }
}