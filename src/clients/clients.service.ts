// import { Injectable, NotFoundException, Param, UnauthorizedException } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { Client } from './client.schema';
// import * as bcrypt from 'bcrypt';

// @Injectable()
// export class ClientsService {
//   constructor(
//     @InjectModel(Client.name) private clientModel: Model<Client>,
//   ) {}

//   async getClientProfile(@Param('id') id: string) : Promise<Partial<Client>> { // Changed return type to Partial<Client>
//     const client = await this.clientModel.findById(id).exec();
//     if (!client) {
//       throw new NotFoundException(`Client with ID ${id} not found`);
//     }
//     // Exclude password and return only the fields we want
//     const { password, ...clientWithoutPassword } = client.toObject();
//     return {
//       _id: clientWithoutPassword._id,
//       name: clientWithoutPassword.name,
//       email: clientWithoutPassword.email,
//       homeAddress: clientWithoutPassword.homeAddress,
//       image: clientWithoutPassword.image,
//       phoneNumber: clientWithoutPassword.phoneNumber,
//     };
//   }

//   async updateClient(id: string, updateData: Partial<Client>): Promise<Partial<Client>> {
//     const client = await this.clientModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
//     if (!client) {
//       throw new NotFoundException(`Client with ID ${id} not found`);
//     }
//     // Exclude password and return only the fields we want
//     const { password, ...clientWithoutPassword } = client.toObject();
//     return {
//       _id: clientWithoutPassword._id,
//       name: clientWithoutPassword.name,
//       email: clientWithoutPassword.email,
//       homeAddress: clientWithoutPassword.homeAddress,
//       image: clientWithoutPassword.image,
//       phoneNumber: clientWithoutPassword.phoneNumber,
//     };
//   }

//   async searchClients(query: string, excludeId: string): Promise<Client[]> {
//     return this.clientModel.find({
//       name: { $regex: query, $options: 'i' },
//       _id: { $ne: excludeId }
//     }).exec();
//   }
  
//   async updateClientPassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
//     const client = await this.clientModel.findById(id).exec();
//     if (!client) {
//       throw new NotFoundException(`Client with ID ${id} not found`);
//     }

//     // Verify current password
//     const isPasswordValid = await bcrypt.compare(currentPassword, client.password);
//     if (!isPasswordValid) {
//       throw new UnauthorizedException('Current password is incorrect');
//     }

//     // Hash new password
//     const hashedNewPassword = await bcrypt.hash(newPassword, 10);

//     // Update password
//     await this.clientModel.findByIdAndUpdate(id, { password: hashedNewPassword }).exec();
//   }

  

// //lle dashboard
// async deleteClient(id: string, reason: string): Promise<void> {
//     const client = await this.clientModel.findById(id).exec();
//     if (!client) {
//       throw new NotFoundException(`Client with ID ${id} not found`);
//     }
//     await this.clientModel.findByIdAndDelete(id).exec();
//     // Log the deletion with reason (e.g., to a separate audit log)
//     console.log(`Client ${id} deleted. Reason: ${reason}`);
//   }

//   async flagClient(id: string, reason: string): Promise<void> {
//     const client = await this.clientModel.findById(id).exec();
//     if (!client) {
//       throw new NotFoundException(`Client with ID ${id} not found`);
//     }
//     client.isFlagged = true; // Add an isFlagged field to the schema if not present
//     client.flagReason = reason;
//     await client.save();
//     console.log(`Client ${id} flagged. Reason: ${reason}`);
//   }


//   async getAllClients(): Promise<Client[]> {
//     try {
//       return await this.clientModel.find().exec();
//     } catch (error) {
//       throw new NotFoundException('Error retrieving clients');
//     }
//   }
// }

import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Client } from './client.schema';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class ClientsService {
  constructor(
    @InjectModel(Client.name) private clientModel: Model<Client>,
    private readonly configService: ConfigService,
  ) {}

  private async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      const transporter = nodemailer.createTransport({
        host: this.configService.get<string>('EMAIL_HOST'),
        port: this.configService.get<number>('EMAIL_PORT'),
        secure: false,
        auth: {
          user: this.configService.get<string>('EMAIL_USER'),
          pass: this.configService.get<string>('EMAIL_PASS'),
        },
      });

      const mailOptions = {
        from: '"FixAura Platform" <fixaura.platforme@gmail.com>',
        to,
        subject,
        html,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Email sent to ${to} with subject: ${subject}`);
    } catch (error) {
      console.error(`Failed to send email to ${to}:`, error);
    }
  }

  private async reactivateClient(id: string, email: string, name: string): Promise<void> {
    await this.clientModel.findByIdAndUpdate(id, {
      status: 'actif',
      deactivationUntil: null,
    }).exec();

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Réactivation de Votre Compte FixAura</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style=" inflate: #28a745;">Réactivation de Votre Compte FixAura</h2>
          <p>Cher(e) ${name},</p>
          <p>Nous vous informons que votre compte client sur la plateforme FixAura a été réactivé le ${new Date().toLocaleString('fr-FR')}.</p>
          <p>Vous pouvez désormais accéder à votre compte et reprendre vos activités.</p>
          <p>Si vous avez des questions, veuillez contacter notre support à <a href="mailto:fixaura.platforme@gmail.com">fixaura.platforme@gmail.com</a>.</p>
          <p>Cordialement,<br>L'équipe FixAura</p>
          <footer style="margin-top: 20px; font-size: 0.9em; color: #666;">
            <p>FixAura Platform<br>Email: fixaura.platforme@gmail.com</p>
          </footer>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail(email, 'Réactivation de Votre Compte FixAura', html);
  }

  async flagClient(id: string, reason: string): Promise<void> {
    const client = await this.clientModel.findById(id).exec();
    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }

    const newFlagCount = (client.flagCount || 0) + 1;
    const updateData: any = {
      isFlagged: true,
      flagReason: reason,
      flagCount: newFlagCount,
    };

    // Flagging email
    const flagHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Notification de Signalement</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #dc3545;">Signalement de Votre Compte FixAura</h2>
          <p>Cher(e) ${client.name},</p>
          <p>Nous vous informons que votre compte client sur la plateforme FixAura a été signalé le ${new Date().toLocaleString('fr-FR')}.</p>
          <h3>Raison du signalement :</h3>
          <p>${reason}</p>
          <p>Nombre total de signalements : ${newFlagCount}</p>
          <p>Veuillez prendre les mesures nécessaires pour résoudre ce problème. Si vous avez des questions, contactez notre support à <a href="mailto:fixaura.platforme@gmail.com">fixaura.platforme@gmail.com</a>.</p>
          <p>Cordialement,<br>L'équipe FixAura</p>
          <footer style="margin-top: 20px; font-size: 0.9em; color: #666;">
            <p>FixAura Platform<br>Email: fixaura.platforme@gmail.com</p>
          </footer>
        </div>
      </body>
      </html>
    `;
    await this.sendEmail(client.email, 'Signalement de Votre Compte FixAura', flagHtml);

    // Handle 5 flags: deactivate for 24 hours
    if (newFlagCount === 5) {
      const deactivationUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
      updateData.status = 'désactivé';
      updateData.deactivationUntil = deactivationUntil;

      const deactivationHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Désactivation Temporaire de Votre Compte FixAura</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #dc3545;">Désactivation Temporaire de Votre Compte FixAura</h2>
            <p>Cher(e) ${client.name},</p>
            <p>En raison de 5 signalements, votre compte client sur la plateforme FixAura a été désactivé temporairement pour 24 heures, jusqu'au ${deactivationUntil.toLocaleString('fr-FR')}.</p>
            <h3>Dernier signalement :</h3>
            <p>${reason}</p>
            <p>Veuillez résoudre les problèmes signalés. Si vous avez des questions, contactez notre support à <a href="mailto:fixaura.platforme@gmail.com">fixaura.platforme@gmail.com</a>.</p>
            <p>Cordialement,<br>L'équipe FixAura</p>
            <footer style="margin-top: 20px; font-size: 0.9em; color: #666;">
              <p>FixAura Platform<br>Email: fixaura.platforme@gmail.com</p>
            </footer>
          </div>
        </body>
        </html>
      `;
      await this.sendEmail(client.email, 'Désactivation Temporaire de Votre Compte FixAura', deactivationHtml);

      // Schedule reactivation
      setTimeout(() => {
        this.reactivateClient(id, client.email, client.name);
      }, 24 * 60 * 60 * 1000);
    }

    // Handle 10 flags: delete account
    if (newFlagCount >= 10) {
      updateData.status = 'supprimé';
      updateData.deletedAt = new Date();
      updateData.deletionReason = 'Compte supprimé automatiquement après 10 signalements';

      const deletionHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Suppression de Votre Compte FixAura</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #dc3545;">Suppression de Votre Compte FixAura</h2>
            <p>Cher(e) ${client.name},</p>
            <p>En raison de 10 signalements, votre compte client sur la plateforme FixAura a été supprimé définitivement le ${new Date().toLocaleString('fr-FR')}.</p>
            <h3>Dernier signalement :</h3>
            <p>${reason}</p>
            <p>Si vous pensez qu'il s'agit d'une erreur, contactez notre support à <a href="mailto:fixaura.platforme@gmail.com">fixaura.platforme@gmail.com</a>.</p>
            <p>Cordialement,<br>L'équipe FixAura</p>
            <footer style="margin-top: 20px; font-size: 0.9em; color: #666;">
              <p>FixAura Platform<br>Email: fixaura.platforme@gmail.com</p>
            </footer>
          </div>
        </body>
        </html>
      `;
      await this.sendEmail(client.email, 'Suppression de Votre Compte FixAura', deletionHtml);
    }

    await this.clientModel.findByIdAndUpdate(id, updateData).exec();
    console.log(`Client ${id} flagged. Flag count: ${newFlagCount}, Reason: ${reason}`);
  }

  async deleteClient(id: string, reason: string): Promise<void> {
    const client = await this.clientModel.findById(id).exec();
    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }
    const deletedAt = new Date();
    await this.clientModel.findByIdAndUpdate(id, {
      status: 'supprimé',
      deletionReason: reason,
      deletedAt,
    }).exec();
    console.log(`Client ${id} soft deleted. Reason: ${reason}`);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Suppression de Votre Compte FixAura</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #dc3545;">Suppression de Votre Compte FixAura</h2>
          <p>Cher(e) ${client.name},</p>
          <p>Nous vous informons que votre compte sur la plateforme FixAura a été supprimé le ${deletedAt.toLocaleString('fr-FR')}.</p>
          <h3>Raison de la suppression :</h3>
          <p>${reason}</p>
          <p>Si vous pensez qu'il s'agit d'une erreur ou si vous avez des questions, veuillez contacter notre support à <a href="mailto:fixaura.platforme@gmail.com">fixaura.platforme@gmail.com</a>.</p>
          <p>Nous vous remercions pour votre compréhension.</p>
          <p>Cordialement,<br>L'équipe FixAura</p>
          <footer style="margin-top: 20px; font-size: 0.9em; color: #666;">
            <p>FixAura Platform<br>Email: fixaura.platforme@gmail.com</p>
          </footer>
        </div>
      </body>
      </html>
    `;
    await this.sendEmail(client.email, 'Suppression de Votre Compte FixAura', html);
  }

  async getClientProfile(id: string): Promise<Partial<Client>> {
    const client = await this.clientModel.findById(id).exec();
    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }
    const { password, ...clientWithoutPassword } = client.toObject();
    return {
      _id: clientWithoutPassword._id,
      name: clientWithoutPassword.name,
      email: clientWithoutPassword.email,
      homeAddress: clientWithoutPassword.homeAddress,
      image: clientWithoutPassword.image,
      phoneNumber: clientWithoutPassword.phoneNumber,
      isFlagged: clientWithoutPassword.isFlagged,
      flagReason: clientWithoutPassword.flagReason,
      status: clientWithoutPassword.status,
      deletionReason: clientWithoutPassword.deletionReason,
      deletedAt: clientWithoutPassword.deletedAt,
      flagCount: clientWithoutPassword.flagCount,
      deactivationUntil: clientWithoutPassword.deactivationUntil,
    };
  }

  async updateClient(id: string, updateData: Partial<Client>): Promise<Partial<Client>> {
    const client = await this.clientModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }
    const { password, ...clientWithoutPassword } = client.toObject();
    return {
      _id: clientWithoutPassword._id,
      name: clientWithoutPassword.name,
      email: clientWithoutPassword.email,
      homeAddress: clientWithoutPassword.homeAddress,
      image: clientWithoutPassword.image,
      phoneNumber: clientWithoutPassword.phoneNumber,
      isFlagged: clientWithoutPassword.isFlagged,
      flagReason: clientWithoutPassword.flagReason,
      status: clientWithoutPassword.status,
      deletionReason: clientWithoutPassword.deletionReason,
      deletedAt: clientWithoutPassword.deletedAt,
      flagCount: clientWithoutPassword.flagCount,
      deactivationUntil: clientWithoutPassword.deactivationUntil,
    };
  }

  async searchClients(query: string, excludeId: string): Promise<Client[]> {
    return this.clientModel
      .find({
        name: { $regex: query, $options: 'i' },
        _id: { $ne: excludeId },
      })
      .exec();
  }

  async updateClientPassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
    const client = await this.clientModel.findById(id).exec();
    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }
    const isPasswordValid = await bcrypt.compare(currentPassword, client.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await this.clientModel.findByIdAndUpdate(id, { password: hashedNewPassword }).exec();
  }

  async getAllClients(): Promise<Client[]> {
    try {
      return await this.clientModel.find().exec();
    } catch (error) {
      throw new NotFoundException('Error retrieving clients');
    }
  }

  async getDeletedClients(): Promise<Client[]> {
    try {
      return await this.clientModel.find({ status: 'supprimé' }).exec();
    } catch (error) {
      throw new NotFoundException('Error retrieving deleted clients');
    }
  }
}