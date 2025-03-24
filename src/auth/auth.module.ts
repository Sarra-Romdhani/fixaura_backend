import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { Prestataire, PrestataireSchema } from '../prestataires/prestataire.schema';
import { Client, ClientSchema } from '../clients/client.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Prestataire.name, schema: PrestataireSchema },
      { name: Client.name, schema: ClientSchema },
    ]),
  ],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}