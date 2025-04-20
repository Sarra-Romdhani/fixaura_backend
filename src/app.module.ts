import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ServicesModule } from './services/services.module';
import { PrestatairesModule } from './prestataires/prestataires.module';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { ReservationsModule } from './reservations/reservations.module';
import { PublicationsModule } from './publications/publications.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { MessagesModule } from './messages/messages.module';
import { PointsModule } from './points/points.module';
import { LocationsModule } from './locations/locations.module';



@Module({
  imports: [
    //MongooseModule.forRoot('mongodb://localhost:27017/fixaura')  ,
    MongooseModule.forRoot(
      'mongodb+srv://salmarouissi1:salmasarra2025@clusterfixaura.u36fh2a.mongodb.net/fixaura?retryWrites=true&w=majority&appName=ClusterFixaura',
    )  ,

   // ProfessionalsModule,
    ServicesModule,
    PrestatairesModule,
    AuthModule,
    ClientsModule,
    ReservationsModule,
    PublicationsModule,
    MessagesModule,
    PointsModule,
    LocationsModule,
    
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
