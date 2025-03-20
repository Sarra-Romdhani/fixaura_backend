import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProfessionalsService } from './professionals.service';
import { ProfessionalsController } from './professionals.controller';
import { ProfessionalSchema } from './professional.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Professional', schema: ProfessionalSchema }]),
  ],
  providers: [ProfessionalsService],
  controllers: [ProfessionalsController],
  exports: [MongooseModule],
})
export class ProfessionalsModule {}