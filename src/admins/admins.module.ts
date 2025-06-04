// import { Module } from '@nestjs/common';
// import { AdminsService } from './admins.service';
// import { AdminsController } from './admins.controller';

// @Module({
//   providers: [AdminsService],
//   controllers: [AdminsController]
// })
// export class AdminsModule {}
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Admin, AdminSchema } from './admin.schema';
import { AdminsService } from './admins.service';
import { AdminsController } from './admins.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Admin', schema: AdminSchema }]),
  ],
  providers: [AdminsService],
  controllers: [AdminsController],
})
export class AdminsModule {}