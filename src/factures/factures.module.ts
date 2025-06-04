import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FacturesController } from './factures.controller';
import { FacturesService } from './factures.service';
import { Facture, FactureSchema } from './facture.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Facture.name, schema: FactureSchema }]),
  ],
  controllers: [FacturesController],
  providers: [FacturesService],
  exports: [FacturesService], // Export FacturesService for use in other modules
})
export class FacturesModule {}