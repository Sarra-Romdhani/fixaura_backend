import { Body, Controller, HttpCode, Patch, Post, UseGuards } from '@nestjs/common';
import { AdminsService } from './admins.service';

@Controller('admins')
export class AdminsController {
  constructor(private readonly adminService:AdminsService) {}


@Post('login')
  @HttpCode(200)
  async login(@Body() loginDto: { email: string; password: string }) {
    const admin = await this.adminService.validateAdmin(loginDto.email, loginDto.password);
    return { message: 'Login successful', admin: { email: admin.email } };
  }
}
