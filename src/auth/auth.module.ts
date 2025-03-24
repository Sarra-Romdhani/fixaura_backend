import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { Auth, AuthSchema } from './auth.schema'; // Changement ici
import { Client, ClientSchema } from 'src/clients/client.schema';
import { Prestataire, PrestataireSchema } from 'src/prestataires/prestataire.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Client.name, schema: ClientSchema },
      { name: Prestataire.name, schema: PrestataireSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}