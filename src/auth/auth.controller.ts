import { Controller, Post, Body, UploadedFile, UseInterceptors, ValidationPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { AuthService } from './auth.service';
import { Client } from '../clients/client.schema';
import { Prestataire } from '../prestataires/prestataire.schema';
import { IsEmail, IsString, MinLength } from 'class-validator';

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
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const fileExt = file.originalname.split('.').pop();
          cb(null, `${file.fieldname}-${uniqueSuffix}.${fileExt}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        console.log('Uploaded file:', file);
        const allowedExtensions = /\.(jpg|jpeg|png|gif)$/i;
        const ext = file.originalname.toLowerCase();
        if (!allowedExtensions.test(ext)) {
          console.log('Rejected file due to invalid extension:', ext);
          return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async signUp(
    @Body() body: any,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<{ message: string; user: Client | Prestataire }> {
    if (file) {
      body.image = `/uploads/${file.filename}`;
    }
    return this.authService.signUp(body);
  }

  @Post('forgot-password')
  async forgotPassword(@Body(ValidationPipe) body: ForgotPasswordBody) {
    console.log('Received forgot-password request for:', body.email);
    const result = await this.authService.forgotPassword(body.email);
    console.log('Sending response:', { success: true, data: result });
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