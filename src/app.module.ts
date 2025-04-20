import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ServicesModule } from './services/services.module';
import { PrestatairesModule } from './prestataires/prestataires.module';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { ReservationsModule } from './reservations/reservations.module';
import { PublicationsModule } from './publications/publications.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(
      'mongodb+srv://salmarouissi1:salmasarra2025@clusterfixaura.u36fh2a.mongodb.net/fixaura?retryWrites=true&w=majority&appName=ClusterFixaura',
    ),
    ServicesModule,
    PrestatairesModule,
    AuthModule,
    ClientsModule,
    ReservationsModule,
    PublicationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
