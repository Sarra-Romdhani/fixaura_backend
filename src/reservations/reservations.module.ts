import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { ReservationSchema } from './reservation.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Reservation', schema: ReservationSchema }]),
  ],
  providers: [ReservationsService],
  controllers: [ReservationsController],
  exports: [ReservationsService], // Exportez le service si vous voulez l'utiliser ailleurs
})
export class ReservationsModule {}