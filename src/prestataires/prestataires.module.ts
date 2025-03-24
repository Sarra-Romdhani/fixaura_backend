import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PrestataireSchema } from './prestataire.schema';
import { PrestatairesService } from './prestataires.service';
import { PrestatairesController } from './prestataires.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Prestataire', schema: PrestataireSchema }]),
  ],
  providers: [PrestatairesService],
  controllers: [PrestatairesController],
  exports: [MongooseModule],
})
export class PrestatairesModule {}