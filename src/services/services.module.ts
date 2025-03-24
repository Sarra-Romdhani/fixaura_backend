import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { ServiceSchema } from './service.schema';
import { PrestatairesModule } from 'src/prestataires/prestataires.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Service', schema: ServiceSchema }]),
   // ProfessionalsModule,
   PrestatairesModule
  ],
  providers: [ServicesService],
  controllers: [ServicesController],
})
export class ServicesModule {}