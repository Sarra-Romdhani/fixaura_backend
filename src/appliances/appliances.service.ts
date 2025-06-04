import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PredictionService } from './prediction.service';
import { ApplianceApp } from './appliance.schema';
import { Client } from 'src/clients/client.schema';
import { Prestataire } from 'src/prestataires/prestataire.schema';
import { ReservationsService } from 'src/reservations/reservations.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AppliancesService {
    private readonly logger = new Logger(AppliancesService.name);

  constructor(
  //  @InjectModel(ApplianceApp.name) ,
      @InjectModel(ApplianceApp.name) private applianceAppModel: Model<ApplianceApp>,

    @InjectModel(Client.name) private clientModel: Model<Client>,
    @InjectModel(Prestataire.name) private prestataireModel: Model<Prestataire>,
    //private applianceAppModel: Model<ApplianceApp>,
    private predictionService: PredictionService,
        private reservationsService: ReservationsService,

  ) {}

  async create(applianceData: Partial<ApplianceApp>): Promise<ApplianceApp> {
    try {
      const prediction = await this.predictionService.predict(applianceData);
      const timestamp = new Date().toISOString();
      
      const newAppliance = new this.applianceAppModel({
        ...applianceData,
        healthScore: this.calculateHealthScore(prediction.confidence),
        prediction: { ...prediction, timestamp },
        history: [{ ...prediction, timestamp }]
      });

      return newAppliance.save();
    } catch (error) {
      throw new Error(`Failed to create appliance: ${error.message}`);
    }
  }

  async findByUserId(userId: string): Promise<ApplianceApp[]> {
    const appliances = await this.applianceAppModel.find({ userId }).exec();
    console.log(`Found ${appliances.length} appliances for userId: ${userId}`);
    return appliances;
  }

  async findById(id: string): Promise<ApplianceApp> {
    const appliance = await this.applianceAppModel.findById(id).exec();
    if (!appliance) throw new NotFoundException('Appliance not found');
    return appliance;
  }

  async update(id: string, updateData: Partial<ApplianceApp>): Promise<ApplianceApp> {
    try {
      const prediction = await this.predictionService.predict(updateData);
      const timestamp = new Date().toISOString();
  
      const updatedAppliance = await this.applianceAppModel.findByIdAndUpdate(
        id,
        {
          ...updateData,
          healthScore: this.calculateHealthScore(prediction.confidence),
          prediction: { ...prediction, timestamp },
          $push: { history: { ...prediction, timestamp } }
        },
        { new: true }
      ).exec();
  
      if (!updatedAppliance) {
        throw new NotFoundException(`Appliance with id ${id} not found`);
      }
  
      return updatedAppliance;
    } catch (error) {
      throw new Error(`Failed to update appliance: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    const result = await this.applianceAppModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Appliance not found');
    }
  }

  async getHistory(id: string): Promise<any[]> {
    const appliance = await this.findById(id);
    return appliance.history || [];
  }

  private calculateHealthScore(confidence: number): number {
    return Math.min(100, Math.max(0, Math.floor(confidence * 1.2)));
  }


  // mail tadhkir 
    async sendMaintenanceReminders(): Promise<void> {
    this.logger.log('[DEBUG] Checking for appliances with nextCheckDate 3 days away');

    try {
      // Get date range for 3 days from now
      const today = new Date();
      const threeDaysFromNow = new Date(today);
      threeDaysFromNow.setDate(today.getDate() + 3);
      threeDaysFromNow.setHours(0, 0, 0, 0); // Start of the day
      const threeDaysFromNowEnd = new Date(threeDaysFromNow);
      threeDaysFromNowEnd.setHours(23, 59, 59, 999); // End of the day

      // Find appliances with nextCheckDate within the range
      const appliances = await this.applianceAppModel
        .find({
          'prediction.nextCheckDate': {
            $gte: threeDaysFromNow.toISOString(),
            $lte: threeDaysFromNowEnd.toISOString(),
          },
        })
        .exec();

      this.logger.log(`[DEBUG] Found ${appliances.length} appliances with nextCheckDate 3 days away`);

      // Process each appliance
      for (const appliance of appliances) {
        const userId = appliance.userId;
        let userEmail: string | null = null;
        let userName: string = 'Client';

        // Fetch user email from Client or Prestataire
        try {
          const client = await this.clientModel.findById(userId).exec();
          if (client && client.email) {
            userEmail = client.email;
            userName = client.name || 'Client';
          } else {
            const prestataire = await this.prestataireModel.findById(userId).exec();
            if (prestataire && prestataire.email) {
              userEmail = prestataire.email;
              userName = prestataire.name || 'Prestataire';
            }
          }
        } catch (e) {
          this.logger.warn(`[DEBUG] Error fetching user email for userId ${userId}: ${e.message}`);
          continue;
        }

        if (!userEmail) {
          this.logger.warn(`[DEBUG] No email found for userId ${userId} for appliance ${appliance._id}`);
          continue;
        }

        // Prepare email content
        const subject = 'Rappel : Entretien recommandé pour votre appareil - Fixaura';
        const message = `
Bonjour ${userName},

Un entretien est recommandé pour votre appareil dans 3 jours, le ${new Date(appliance.prediction.nextCheckDate).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.

Détails de l'appareil :
- Modèle : ${appliance.modele || 'N/A'}
- Marque : ${appliance.brand || 'N/A'}
- Statut : ${appliance.prediction.status || 'N/A'}
- Score de santé : ${appliance.healthScore?.toFixed(1) || 'N/A'}

Planifiez un entretien via l'application Fixaura ou contactez-nous à support@fixaura.com.

Merci de faire confiance à Fixaura,
L'équipe Fixaura
        `;

        // Send email
        try {
          const emailSent = await this.reservationsService.sendEmail(userEmail, subject, message);
          if (emailSent) {
            this.logger.log(`[DEBUG] Maintenance reminder email sent to ${userEmail} for appliance ${appliance._id}`);
          } else {
            this.logger.warn(`[DEBUG] Failed to send maintenance reminder email to ${userEmail} for appliance ${appliance._id}`);
          }
        } catch (e) {
          this.logger.warn(`[DEBUG] Error sending maintenance reminder email to ${userEmail} for appliance ${appliance._id}: ${e.message}`);
        }
      }
    } catch (error) {
      this.logger.error(`[ERROR] Failed to send maintenance reminders: ${error.message}`);
      throw new InternalServerErrorException('Failed to send maintenance reminders');
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleDailyMaintenanceReminderTask() {
    this.logger.log('[DEBUG] Running daily maintenance reminder task');
    await this.sendMaintenanceReminders();
    this.logger.log('[DEBUG] Daily maintenance reminder task completed');
  }



}