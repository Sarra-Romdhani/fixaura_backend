import { Controller, Post, Body, Req, ValidationPipe, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Client } from '../clients/client.schema';
import { Prestataire } from '../prestataires/prestataire.schema';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { FastifyRequest } from 'fastify';
import * as fs from 'fs/promises';
import { join } from 'path';

class SignInBody {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

class ForgotPasswordBody {
  @IsEmail()
  email: string;
}

class VerifyCodeBody {
  @IsEmail()
  email: string;

  @IsString()
  code: string;
}

class ResetPasswordBody {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
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

  @Post('signup')
  async signUp(@Req() req: FastifyRequest): Promise<{ message: string; user: Client | Prestataire }> {
    const parts = req.parts();
    const fields: Record<string, string> = {};
    let imagePath = '';

    for await (const part of parts) {
      if (part.type === 'file') {
        const allowedExtensions = /\.(jpg|jpeg|png|gif)$/i;
        if (!allowedExtensions.test(part.filename)) {
          throw new Error('Only image files are allowed!');
        }
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const fileExt = part.filename.split('.').pop();
        const filename = `image-${uniqueSuffix}.${fileExt}`;
        imagePath = `/uploads/${filename}`;
        const filePath = join(__dirname, '..', '..', 'uploads', filename);
        await fs.writeFile(filePath, await part.toBuffer());
      } else {
        fields[part.fieldname] = part.value as string;
      }
    }

    if (!fields.userType || !['client', 'prestataire'].includes(fields.userType)) {
      throw new BadRequestException('userType must be either "client" or "prestataire"');
    }

    const body = {
      ...fields,
      image: imagePath || '',
    };

    return this.authService.signUp(body);
  }

  @Post('forgot-password')
  async forgotPassword(@Body(ValidationPipe) body: ForgotPasswordBody) {
    const result = await this.authService.forgotPassword(body.email);
    return {
      success: true,
      data: result,
    };
  }

  @Post('verify-code')
  async verifyCode(@Body(ValidationPipe) body: VerifyCodeBody) {
    const result = await this.authService.verifyCode(body.email, body.code);
    return {
      success: true,
      data: result,
    };
  }

  @Post('reset-password')
  async resetPassword(@Body(ValidationPipe) body: ResetPasswordBody) {
    const result = await this.authService.resetPassword(body.email, body.newPassword);
    return {
      success: true,
      data: result,
    };
  }
}