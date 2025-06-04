import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Admin } from './admin.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Observable, tap, catchError, throwError } from 'rxjs';

@Injectable()
export class AdminsService {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<Admin>,
  ) {}


  async findByEmail(email: string): Promise<Admin> {
    const admin = await this.adminModel.findOne({ email }).exec();
    if (!admin) throw new NotFoundException('Admin not found');
    return admin;
  }

  async validateAdmin(email: string, password: string): Promise<Admin> {
    const admin = await this.findByEmail(email);
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) throw new UnauthorizedException('Invalid password');
    return admin;
  }

  async createAdmin(email: string, password: string): Promise<Admin> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new this.adminModel({ email, password: hashedPassword });
    return admin.save();
  }



}
