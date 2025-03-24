import { Controller, Post, Body, ValidationPipe, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { IsEmail, IsString, MinLength } from 'class-validator'; // Ensure this import works now

class SignInBody {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signin')
  async signIn(@Body(ValidationPipe) signInData: SignInBody) {
    const result = await this.authService.signIn(signInData.email, signInData.password);
    return {
      success: true,
      data: result,
    };
  }
}