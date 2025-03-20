import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ServicesModule } from './services/services.module';
import { ProfessionalsModule } from './professionals/professionals.module';
import { PrestatairesModule } from './prestataires/prestataires.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/fixaura')  ,
   // ProfessionalsModule,
    ServicesModule,
    PrestatairesModule,
 

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
