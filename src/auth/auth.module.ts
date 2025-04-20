import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { Prestataire, PrestataireSchema } from '../prestataires/prestataire.schema';
import { Client, ClientSchema } from '../clients/client.schema';
import { Auth, AuthSchema } from './auth.schema';
import { VerificationCodeSchema } from 'src/verification-code.schema';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forFeature([
      { name: Prestataire.name, schema: PrestataireSchema },
      { name: Client.name, schema: ClientSchema },
      { name: 'VerificationCode', schema: VerificationCodeSchema },
    ]),
  ],
  providers: [AuthService],
  controllers: [AuthController],
 

 
})
export class AuthModule {}