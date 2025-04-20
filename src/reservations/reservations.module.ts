import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { ReservationSchema } from './reservation.schema';
import { MessagesModule } from '../messages/messages.module'; // Import MessagesModule
import { PrestatairesModule } from 'src/prestataires/prestataires.module';
import { ClientsModule } from 'src/clients/clients.module';
import { PointsModule } from 'src/points/points.module';
import { LocationsModule } from 'src/locations/locations.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Reservation', schema: ReservationSchema }]),
    MessagesModule, // Add this line
    PointsModule,
    ClientsModule, // Add this to provide ClientModel
    PrestatairesModule,
    LocationsModule, // Add this line

  ],
  providers: [ReservationsService],
  controllers: [ReservationsController],
  exports: [ReservationsService], // Exportez le service si vous voulez l'utiliser ailleurs
})
export class ReservationsModule {}