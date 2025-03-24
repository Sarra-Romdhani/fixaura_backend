import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Client } from '../clients/client.schema';
import { Prestataire } from '../prestataires/prestataire.schema';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signUp(@Body() body: any): Promise<{ message: string; user: Client | Prestataire }> {
    return this.authService.signUp(body);
  }
}