// import { NestFactory } from '@nestjs/core';
// import { AppModule } from 'src/app.module';
// import { AdminsService } from './admins.service';

// async function main() {
//   const app = await NestFactory.createApplicationContext(AppModule);
//   const adminsService = await app.get('AdminsService');

//   const email = 'admin@example.com';
//   const password = 'admin123'; // Change in production

//   try {
//     const existingAdmin = await adminsService.findByEmail(email);
//     console.log('Admin already exists:', existingAdmin.email);
//   } catch (error) {
//     const admin = await adminsService.createAdmin(email, password);
//     console.log('Admin created:', admin.email);
//   }

//   await app.close();
// }

// main();