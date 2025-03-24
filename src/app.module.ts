import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ServicesModule } from './services/services.module';
import { PrestatairesModule } from './prestataires/prestataires.module';
import { PublicationsModule } from './publications/publications.module';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/fixaura')  ,
    ServicesModule,
    PrestatairesModule,
    PublicationsModule,
    AuthModule,
    ClientsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
