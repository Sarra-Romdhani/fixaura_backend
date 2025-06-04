import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AppliancesController } from './appliances.controller';
import { PredictionService } from './prediction.service';
import { AppliancesService } from './appliances.service';
import { ApplianceApp, ApplianceAppSchema } from './appliance.schema';
import { ClientsModule } from '../clients/clients.module';
import { PrestatairesModule } from '../prestataires/prestataires.module';
import { ReservationsModule } from '../reservations/reservations.module';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([{ name: ApplianceApp.name, schema: ApplianceAppSchema }]),
    HttpModule,
    ClientsModule, // Provides ClientModel
    PrestatairesModule, // Provides PrestataireModel
    ReservationsModule, // Provides ReservationsService
  ],
  controllers: [AppliancesController],
  providers: [AppliancesService, PredictionService],
})
export class AppliancesModule {}