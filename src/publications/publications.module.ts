import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PublicationsService } from './publications.service';
import { PublicationsController } from './publications.controller';
import { PublicationSchema } from './publication.schema';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: "Publication", schema: PublicationSchema }]),
  ],
  controllers: [PublicationsController],
  providers: [PublicationsService],
})
export class PublicationsModule {}