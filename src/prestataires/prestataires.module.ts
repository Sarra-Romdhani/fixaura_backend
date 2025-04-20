import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PrestataireSchema } from './prestataire.schema';
import { PrestatairesService } from './prestataires.service';
import { PrestatairesController } from './prestataires.controller';
import { ReservationSchema } from 'src/reservations/reservation.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Prestataire', schema: PrestataireSchema },
      { name: 'Reservation', schema: ReservationSchema }, // Ajoutez ReservationSchema

    ]),
  ],
  providers: [PrestatairesService],
  controllers: [PrestatairesController],
  exports: [PrestatairesService,MongooseModule],
})
export class PrestatairesModule {}