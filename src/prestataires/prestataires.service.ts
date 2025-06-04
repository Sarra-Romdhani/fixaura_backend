import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Prestataire } from './prestataire.schema';
import { Reservation } from 'src/reservations/reservation.schema';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class PrestatairesService {
  constructor(
    @InjectModel('Prestataire') private prestataireModel: Model<Prestataire>,
    @InjectModel('Reservation') private reservationModel: Model<Reservation>,
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

  private async reactivatePrestataire(id: string, email: string, name: string): Promise<void> {
    await this.prestataireModel.findByIdAndUpdate(id, {
      available: true,
      deactivationUntil: null,
      status: 'actif',
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
          <h2 style="color: #28a745;">Réactivation de Votre Compte FixAura</h2>
          <p>Cher(e) ${name},</p>
          <p>Nous vous informons que votre compte prestataire sur la plateforme FixAura a été réactivé le ${new Date().toLocaleString('fr-FR')}.</p>
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

  // async flagPrestataire(id: string, reason: string): Promise<Prestataire> {
  //   const prestataire = await this.prestataireModel.findById(id).exec();
  //   if (!prestataire) {
  //     throw new NotFoundException(`Prestataire with ID ${id} not found`);
  //   }

  //   const newFlagCount = (prestataire.flagCount || 0) + 1;
  //   const updateData: any = {
  //     isFlagged: true,
  //     flagReason: reason,
  //     flagCount: newFlagCount,
  //   };

  //   // Flagging email
  //   const flagHtml = `
  //     <!DOCTYPE html>
  //     <html>
  //     <head>
  //       <meta charset="UTF-8">
  //       <title>Notification de Signalement</title>
  //     </head>
  //     <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  //       <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
  //         <h2 style="color: #dc3545;">Signalement de Votre Compte FixAura</h2>
  //         <p>Cher(e) ${prestataire.name},</p>
  //         <p>Nous vous informons que votre compte prestataire sur la plateforme FixAura a été signalé le ${new Date().toLocaleString('fr-FR')}.</p>
  //         <h3>Raison du signalement :</h3>
  //         <p>${reason}</p>
  //         <p>Nombre total de signalements : ${newFlagCount}</p>
  //         <p>Veuillez prendre les mesures nécessaires pour résoudre ce problème. Si vous avez des questions, contactez notre support à <a href="mailto:fixaura.platforme@gmail.com">fixaura.platforme@gmail.com</a>.</p>
  //         <p>Cordialement,<br>L'équipe FixAura</p>
  //         <footer style="margin-top: 20px; font-size: 0.9em; color: #666;">
  //           <p>FixAura Platform<br>Email: fixaura.platforme@gmail.com</p>
  //         </footer>
  //       </div>
  //     </body>
  //     </html>
  //   `;
  //   await this.sendEmail(prestataire.email, 'Signalement de Votre Compte FixAura', flagHtml);

  //   // Handle 5 flags: deactivate for 24 hours
  //   if (newFlagCount === 5) {
  //     const deactivationUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
  //     updateData.available = false;
  //     updateData.deactivationUntil = deactivationUntil;
  //     updateData.status = 'désactivé';

  //     const deactivationHtml = `
  //       <!DOCTYPE html>
  //       <html>
  //       <head>
  //         <meta charset="UTF-8">
  //         <title>Désactivation Temporaire de Votre Compte FixAura</title>
  //       </head>
  //       <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  //         <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
  //           <h2 style="color: #dc3545;">Désactivation Temporaire de Votre Compte FixAura</h2>
  //           <p>Cher(e) ${prestataire.name},</p>
  //           <p>En raison de 5 signalements, votre compte prestataire sur la plateforme FixAura a été désactivé temporairement pour 24 heures, jusqu'au ${deactivationUntil.toLocaleString('fr-FR')}.</p>
  //           <h3>Dernier signalement :</h3>
  //           <p>${reason}</p>
  //           <p>Veuillez résoudre les problèmes signalés. Si vous avez des questions, contactez notre support à <a href="mailto:fixaura.platforme@gmail.com">fixaura.platforme@gmail.com</a>.</p>
  //           <p>Cordialement,<br>L'équipe FixAura</p>
  //           <footer style="margin-top: 20px; font-size: 0.9em; color: #666;">
  //             <p>FixAura Platform<br>Email: fixaura.platforme@gmail.com</p>
  //           </footer>
  //         </div>
  //       </body>
  //       </html>
  //     `;
  //     await this.sendEmail(prestataire.email, 'Désactivation Temporaire de Votre Compte FixAura', deactivationHtml);

  //     // Schedule reactivation
  //     setTimeout(() => {
  //       this.reactivatePrestataire(id, prestataire.email, prestataire.name);
  //     }, 24 * 60 * 60 * 1000);
  //   }

  //   // Handle 10 flags: delete account
  //   if (newFlagCount >= 10) {
  //     updateData.status = 'supprimé';
  //     updateData.deletedAt = new Date();
  //     updateData.deletionReason = 'Compte supprimé automatiquement après 10 signalements';
  //     updateData.available = false;
  //     updateData.deactivationUntil = null;

  //     const deletionHtml = `
  //       <!DOCTYPE html>
  //       <html>
  //       <head>
  //         <meta charset="UTF-8">
  //         <title>Suppression de Votre Compte FixAura</title>
  //       </head>
  //       <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  //         <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
  //           <h2 style="color: #dc3545;">Suppression de Votre Compte FixAura</h2>
  //           <p>Cher(e) ${prestataire.name},</p>
  //           <p>En raison de 10 signalements, votre compte prestataire sur la plateforme FixAura a été supprimé définitivement le ${new Date().toLocaleString('fr-FR')}.</p>
  //           <h3>Dernier signalement :</h3>
  //           <p>${reason}</p>
  //           <p>Si vous pensez qu'il s'agit d'une erreur, contactez notre support à <a href="mailto:fixaura.platforme@gmail.com">fixaura.platforme@gmail.com</a>.</p>
  //           <p>Cordialement,<br>L'équipe FixAura</p>
  //           <footer style="margin-top: 20px; font-size: 0.9em; color: #666;">
  //             <p>FixAura Platform<br>Email: fixaura.platforme@gmail.com</p>
  //           </footer>
  //         </div>
  //       </body>
  //       </html>
  //     `;
  //     await this.sendEmail(prestataire.email, 'Suppression de Votre Compte FixAura', deletionHtml);
  //   }

  //   const updatedPrestataire = await this.prestataireModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
  //   if (!updatedPrestataire) {
  //     throw new NotFoundException(`Prestataire with ID ${id} not found after update`);
  //   }
  //   console.log(`Prestataire ${id} flagged. Flag count: ${newFlagCount}, Status: ${updateData.status || 'actif'}, Reason: ${reason}`);
  //   return updatedPrestataire;
  // }
  // In prestataires.service.ts
async flagPrestataire(id: string, reason: string): Promise<Prestataire> {
  const prestataire = await this.prestataireModel.findById(id).exec();
  if (!prestataire) {
    throw new NotFoundException(`Prestataire with ID ${id} not found`);
  }

  const newFlagCount = (prestataire.flagCount || 0) + 1;
  const updateData: any = {
    isFlagged: true,
    flagReason: [...(prestataire.flagReason || []), reason], // Append new reason to the array
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
        <p>Cher(e) ${prestataire.name},</p>
        <p>Nous vous informons que votre compte prestataire sur la plateforme FixAura a été signalé le ${new Date().toLocaleString('fr-FR')}.</p>
        <h3>Raison du signalement :</h3>
        <p>${reason}</p>
        <p>Nombre total de signalements : ${newFlagCount}</p>
        <p>Raisons cumulées des signalements :</p>
        <ul>
          ${(prestataire.flagReason || []).concat(reason).map((r: string) => `<li>${r}</li>`).join('')}
        </ul>
        <p>Veuillez prendre les mesures nécessaires pour résoudre ce problème. Si vous avez des questions, contactez notre support à <a href="mailto:fixaura.platforme@gmail.com">fixaura.platforme@gmail.com</a>.</p>
        <p>Cordialement,<br>L'équipe FixAura</p>
        <footer style="margin-top: 20px; font-size: 0.9em; color: #666;">
          <p>FixAura Platform<br>Email: fixaura.platforme@gmail.com</p>
        </footer>
      </div>
    </body>
    </html>
  `;
  await this.sendEmail(prestataire.email, 'Signalement de Votre Compte FixAura', flagHtml);

  // Handle 5 flags: deactivate for 24 hours
  if (newFlagCount === 5) {
    const deactivationUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    updateData.available = false;
    updateData.deactivationUntil = deactivationUntil;
    updateData.status = 'désactivé';

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
          <p>Cher(e) ${prestataire.name},</p>
          <p>En raison de 5 signalements, votre compte prestataire sur la plateforme FixAura a été désactivé temporairement pour 24 heures, jusqu'au ${deactivationUntil.toLocaleString('fr-FR')}.</p>
          <h3>Dernier signalement :</h3>
          <p>${reason}</p>
          <p>Raisons cumulées des signalements :</p>
          <ul>
            ${(prestataire.flagReason || []).concat(reason).map((r: string) => `<li>${r}</li>`).join('')}
          </ul>
          <p>Veuillez résoudre les problèmes signalés. Si vous avez des questions, contactez notre support à <a href="mailto:fixaura.platforme@gmail.com">fixaura.platforme@gmail.com</a>.</p>
          <p>Cordialement,<br>L'équipe FixAura</p>
          <footer style="margin-top: 20px; font-size: 0.9em; color: #666;">
            <p>FixAura Platform<br>Email: fixaura.platforme@gmail.com</p>
          </footer>
        </div>
      </body>
      </html>
    `;
    await this.sendEmail(prestataire.email, 'Désactivation Temporaire de Votre Compte FixAura', deactivationHtml);

    // Schedule reactivation
    setTimeout(() => {
      this.reactivatePrestataire(id, prestataire.email, prestataire.name);
    }, 24 * 60 * 60 * 1000);
  }

  // Handle 10 flags: delete account
  if (newFlagCount >= 10) {
    updateData.status = 'supprimé';
    updateData.deletedAt = new Date();
    updateData.deletionReason = 'Compte supprimé automatiquement après 10 signalements';
    updateData.available = false;
    updateData.deactivationUntil = null;

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
          <p>Cher(e) ${prestataire.name},</p>
          <p>En raison de 10 signalements, votre compte prestataire sur la plateforme FixAura a été supprimé définitivement le ${new Date().toLocaleString('fr-FR')}.</p>
          <h3>Dernier signalement :</h3>
          <p>${reason}</p>
          <p>Raisons cumulées des signalements :</p>
          <ul>
            ${(prestataire.flagReason || []).concat(reason).map((r: string) => `<li>${r}</li>`).join('')}
          </ul>
          <p>Si vous pensez qu'il s'agit d'une erreur, contactez notre support à <a href="mailto:fixaura.platforme@gmail.com">fixaura.platforme@gmail.com</a>.</p>
          <p>Cordialement,<br>L'équipe FixAura</p>
          <footer style="margin-top: 20px; font-size: 0.9em; color: #666;">
            <p>FixAura Platform<br>Email: fixaura.platforme@gmail.com</p>
          </footer>
        </div>
      </body>
      </html>
    `;
    await this.sendEmail(prestataire.email, 'Suppression de Votre Compte FixAura', deletionHtml);
  }

  const updatedPrestataire = await this.prestataireModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
  if (!updatedPrestataire) {
    throw new NotFoundException(`Prestataire with ID ${id} not found after update`);
  }
  console.log(`Prestataire ${id} flagged. Flag count: ${newFlagCount}, Status: ${updateData.status || 'actif'}, Reasons: ${updateData.flagReason.join(', ')}`);
  return updatedPrestataire;
}

  async deletePrestataire(id: string, reason: string): Promise<void> {
    const prestataire = await this.prestataireModel.findById(id).exec();
    if (!prestataire) {
      throw new NotFoundException(`Prestataire with ID ${id} not found`);
    }
    const deletedAt = new Date();
    await this.prestataireModel.findByIdAndUpdate(id, {
      status: 'supprimé',
      deletionReason: reason,
      deletedAt,
      available: false,
      deactivationUntil: null,
    }).exec();
    console.log(`Prestataire ${id} soft deleted. Reason: ${reason}`);

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
          <p>Cher(e) ${prestataire.name},</p>
          <p>Nous vous informons que votre compte prestataire sur la plateforme FixAura a été supprimé le ${deletedAt.toLocaleString('fr-FR')}.</p>
          <h3>Raison de la suppression :</h3>
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
    await this.sendEmail(prestataire.email, 'Suppression de Votre Compte FixAura', html);
  }

  async getAllPrestataires(): Promise<Prestataire[]> {
    const prestataires = await this.prestataireModel.find().exec();
    return prestataires;
  }

  async getDeletedPrestataires(): Promise<Prestataire[]> {
    return this.prestataireModel.find({ status: 'supprimé' }).exec();
  }

  async findById(id: string): Promise<Prestataire> {
    const prestataire = await this.prestataireModel.findById(id).exec();
    if (!prestataire) {
      throw new NotFoundException(`Prestataire with ID ${id} not found`);
    }
    return prestataire;
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
    if (minPrice) query.minPrice = { $gte: minPrice };
    if (maxPrice) query.maxPrice = { $lte: maxPrice };
    if (category) query.category = category;
    if (job) query.job = job;
    if (excludeId) query._id = { $ne: excludeId };
    return this.prestataireModel.find(query).exec();
  }

  async searchByCategory(category: string): Promise<Prestataire[]> {
    const filter = {
      category: { $regex: new RegExp(category, 'i') },
    };
    return this.prestataireModel.find(filter).exec();
  }

  async findPrestatairesWithSameJob(id: string): Promise<Prestataire[]> {
    const prestataire = await this.prestataireModel.findById(id).exec();
    if (!prestataire) {
      throw new NotFoundException(`Prestataire with ID ${id} not found`);
    }
    return this.prestataireModel
      .find({ job: prestataire.job, _id: { $ne: id } })
      .exec();
  }

  async searchByNameAndSameJob(id: string, name?: string): Promise<Prestataire[]> {
    const prestataire = await this.prestataireModel.findById(id).exec();
    if (!prestataire) {
      throw new NotFoundException(`Prestataire with ID ${id} not found`);
    }
    const filter: any = {
      job: prestataire.job,
      _id: { $ne: id },
    };
    if (name) {
      filter.name = { $regex: new RegExp(name, 'i') };
    }
    return this.prestataireModel.find(filter).exec();
  }

  async getBookingStatistics(id_prestataire: string): Promise<{ confirmed: number; pending: number }> {
    const confirmedQuery = {
      id_prestataire,
      status: { $regex: /^confirmed$/i },
    };
    const pendingQuery = {
      id_prestataire,
      status: { $regex: /^pending$/i },
    };
    const [confirmed, pending] = await Promise.all([
      this.reservationModel.countDocuments(confirmedQuery),
      this.reservationModel.countDocuments(pendingQuery),
    ]);
    return { confirmed, pending };
  }

  async updatePrestataire(id: string, updateData: Partial<Prestataire>): Promise<Prestataire> {
    const updated = await this.prestataireModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true })
      .exec();
    if (!updated) {
      throw new NotFoundException(`Prestataire ${id} non trouvé`);
    }
    return updated;
  }

  async getAllPrestatairesExcept(excludeId: string): Promise<Prestataire[]> {
    return this.prestataireModel.find({ _id: { $ne: excludeId } }).exec();
  }

  async getPrestataireByNameAndCategory(name: string, category?: string): Promise<Prestataire[]> {
    const filter: any = {};
    if (name) {
      filter.name = { $regex: new RegExp(name, 'i') };
    }
    if (category) {
      filter.category = { $regex: new RegExp(category, 'i') };
    }
    return this.prestataireModel.find(filter).exec();
  }

  async getPrestataireByJobAndName(job: string, name?: string): Promise<Prestataire[]> {
    const filter: any = {
      job: { $regex: new RegExp(job, 'i') },
    };
    if (name) {
      filter.name = { $regex: new RegExp(name, 'i') };
    }
    return this.prestataireModel.find(filter).exec();
  }

  async getPrestataireByJobAndPriceRange(job: string, maxPrice: number): Promise<Prestataire[]> {
    const filter: any = {
      job: { $regex: new RegExp(job, 'i') },
      maxPrice: { $lte: maxPrice },
    };
    return this.prestataireModel.find(filter).exec();
  }

  async findPrestatairesWithDifferentJob(id: string): Promise<Prestataire[]> {
    const prestataire = await this.prestataireModel.findById(id).exec();
    if (!prestataire) {
      throw new NotFoundException(`Prestataire with ID ${id} not found`);
    }
    return this.prestataireModel
      .find({ job: { $ne: prestataire.job }, _id: { $ne: id } })
      .exec();
  }

  async searchByNameWithDifferentJob(id: string, name?: string): Promise<Prestataire[]> {
    const prestataire = await this.prestataireModel.findById(id).exec();
    if (!prestataire) {
      throw new NotFoundException(`Prestataire with ID ${id} not found`);
    }
    const filter: any = {
      job: { $ne: prestataire.job },
      _id: { $ne: id },
    };
    if (name) {
      filter.name = { $regex: new RegExp(name, 'i') };
    }
    return this.prestataireModel.find(filter).exec();
  }


// prestataires.service.ts
async getTopRatedPrestatairesByJobInCategory(category: string): Promise<Prestataire[]> {
  try {
    // Step 1: Find all distinct jobs in the given category
    const jobs = await this.prestataireModel.distinct('job', { category: { $regex: new RegExp(category, 'i') } }).exec();

    if (!jobs || jobs.length === 0) {
      throw new NotFoundException(`No jobs found for category: ${category}`);
    }

    // Step 2: For each job, find the prestataire with the highest rating
    const topRatedPrestataires = await Promise.all(
      jobs.map(async (job) => {
        const prestataire = await this.prestataireModel
          .findOne({
            category: { $regex: new RegExp(category, 'i') },
            job: { $regex: new RegExp(job, 'i') },
          })
  //         .sort({ rating: -1 })
  //         .exec();
  //       return prestataire;
  //     }),
  //   );
  //   return topRatedPrestataires.filter((prestataire) => prestataire !== null);
  // }
          .sort({ rating: -1 }) // Sort by rating in descending order
          .exec();
        return prestataire;
      })
    );

    // Step 3: Filter out any null results (in case a job has no prestataires)
    const validPrestataires = topRatedPrestataires.filter((prestataire) => prestataire !== null);

    console.log(`Top-rated prestataires for category ${category}:`, validPrestataires);
    return validPrestataires;
  } catch (error) {
    console.error('Error fetching top-rated prestataires:', error.stack || error);
    throw error;
  }
}
}