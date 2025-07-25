import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';
import fastifyStatic from '@fastify/static';
import { Server } from 'socket.io';
import { MessagesService } from './messages/messages.service';
import { LocationService } from './locations/locations.service';
import { ReservationsService } from './reservations/reservations.service';
import * as fs from 'fs';
import multipart from '@fastify/multipart';
import { ConfigService } from '@nestjs/config';
import { HttpException, HttpStatus } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      bodyLimit: 50 * 1024 * 1024, // 50MB limit for the entire request
    }),
  );

  // Register fastify-multipart with increased files limit
  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB per file
      files: 10, // Allow up to 10 files
      fieldSize: 1000000, // 1MB for fields
      fieldNameSize: 100, // Max length of field names
      fields: 10, // Max number of non-file fields
    },
  });
  console.log('fastify-multipart registered successfully');

  // Enable CORS for Flutter app
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Serve static files from the /Uploads directory
  await app.register(fastifyStatic, {
    root: join(__dirname, '..', 'Uploads'),
    prefix: '/uploads/',
  });

  // Create upload directories if they don’t exist
  const uploadDirs = ['./Uploads', './Uploads/publications', './Uploads/profiles'];
  uploadDirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe());

  // Global error handler for multipart limits
  app.getHttpAdapter().getInstance().setErrorHandler((error, request, reply) => {
    if (error.code === 'FST_FILES_LIMIT') {
      reply.code(413).send({
        statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
        error: 'Too Many Files',
        message: 'The number of uploaded files exceeds the limit of 10.',
      });
    } else {
      // Default error handling
      reply.code(error.statusCode || 500).send({
        statusCode: error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
        error: error.name || 'Internal Server Error',
        message: error.message || 'An unexpected error occurred',
      });
    }
  });

  const configService = app.get(ConfigService);
  console.log('[DEBUG] EMAIL_USER:', configService.get<string>('EMAIL_USER') || 'undefined');
  console.log('[DEBUG] EMAIL_PASS:', configService.get<string>('EMAIL_PASS') ? '****' : 'undefined');
  console.log('[DEBUG] EMAIL_HOST:', configService.get<string>('EMAIL_HOST') || 'undefined');
  console.log('[DEBUG] EMAIL_PORT:', configService.get<number>('EMAIL_PORT') || 'undefined');

  // Start the server
  await app.listen(3000, '0.0.0.0');
  console.log(`Application is running on: ${await app.getUrl()}`);

  // Initialize Socket.IO
  const fastifyInstance = app.getHttpAdapter().getInstance();
  const io = new Server(fastifyInstance.server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Handle WebSocket connections
  io.on('connection', (socket) => {
    console.log('New WebSocket connection:', socket.id);

    socket.on('join', (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined room`);
    });

    socket.on('joinReservation', (data) => {
      const { reservationId, userId } = data;
      socket.join(reservationId);
      console.log(`User ${userId} joined reservation room ${reservationId}`);
    });

    socket.on('sendMessage', async (data) => {
      const { senderId, receiverId, content } = data;
      io.to(receiverId).emit('newMessage', { senderId, receiverId, content });
      console.log(`Message sent to ${receiverId}: ${content}`);
    });

    socket.on('updateLocation', async (data) => {
      try {
        const { prestataireId, reservationId, lat, lng } = data;
        if (typeof lat !== 'number' || typeof lng !== 'number') {
          throw new Error('Invalid coordinates');
        }
        const locationService = app.get(LocationService);
        await locationService.updateLocation(prestataireId, reservationId, { lat, lng });
        io.to(reservationId).emit(`locationUpdate-${reservationId}`, {
          coordinates: { lat, lng },
        });
      } catch (e) {
        console.error('Location update error:', e);
      }
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected:', socket.id);
    }
  )});

  // Inject services and pass io
  const messagesService = app.get(MessagesService);
  const locationService = app.get(LocationService);
  const reservationsService = app.get(ReservationsService);
  messagesService.setSocketIo(io);
  locationService.setSocketIo(io);
  reservationsService.setSocketIo(io);

}

bootstrap();






























// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';
// import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
// import { join } from 'path';
// import { ValidationPipe } from '@nestjs/common';
// import fastifyStatic from '@fastify/static';
// import { Server } from 'socket.io';
// import { MessagesService } from './messages/messages.service';
// import { LocationService } from './locations/locations.service';
// import { ReservationsService } from './reservations/reservations.service';
// import * as fs from 'fs';
// import multipart from '@fastify/multipart';
// import { ConfigService } from '@nestjs/config';

// async function bootstrap() {
//   const app = await NestFactory.create<NestFastifyApplication>(
//     AppModule,
//     new FastifyAdapter({
//       bodyLimit: 50 * 1024 * 1024, // 50MB limit for the entire request
//     }),
//   );

//   // Register fastify-multipart
//   await app.register(multipart, {
//     limits: {
//       fileSize: 50 * 1024 * 1024, // 50MB limit per file
//       files: 5, // Allow up to 5 files
//       fieldSize: 1000000, // 1MB for fields
//     },
//   });
//   console.log('fastify-multipart registered successfully');

//   // Enable CORS for Flutter app
//   app.enableCors({
//     origin: '*',
//     methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
//     credentials: true,
//   });

//   // Serve static files from the /Uploads directory
//   await app.register(fastifyStatic, {
//     root: join(__dirname, '..', 'Uploads'),
//     prefix: '/uploads/',
//     setHeaders: (res, path) => {
//       res.setHeader('Access-Control-Allow-Origin', '*');
//       res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
//       if (path.endsWith('.mp4')) {
//         res.setHeader('Content-Type', 'video/mp4');
//         console.log(`Serving video: ${path}`);
//       }
//     },
//   });

//   // Create upload directories if they don’t exist
//   const uploadDirs = ['./Uploads', './Uploads/publications', './Uploads/profiles'];
//   uploadDirs.forEach((dir) => {
//     if (!fs.existsSync(dir)) {
//       fs.mkdirSync(dir, { recursive: true });
//       console.log(`Created directory: ${dir}`);
//     }
//   });

//   // Global validation pipe
//   app.useGlobalPipes(new ValidationPipe());

//   const configService = app.get(ConfigService);
//   console.log('[DEBUG] EMAIL_USER:', configService.get<string>('EMAIL_USER') || 'undefined');
//   console.log('[DEBUG] EMAIL_PASS:', configService.get<string>('EMAIL_PASS') ? '****' : 'undefined');
//   console.log('[DEBUG] EMAIL_HOST:', configService.get<string>('EMAIL_HOST') || 'undefined');
//   console.log('[DEBUG] EMAIL_PORT:', configService.get<number>('EMAIL_PORT') || 'undefined');

//   // Start the server
//   await app.listen(3000, '0.0.0.0');
//   console.log(`Application is running on: ${await app.getUrl()}`);

//   // Initialize Socket.IO
//   const fastifyInstance = app.getHttpAdapter().getInstance();
//   const io = new Server(fastifyInstance.server, {
//     cors: {
//       origin: '*',
//       methods: ['GET', 'POST'],
//     },
//   });

//   // Handle WebSocket connections
//   io.on('connection', (socket) => {
//     console.log('New WebSocket connection:', socket.id);

//     socket.on('join', (userId) => {
//       socket.join(userId);
//       console.log(`User ${userId} joined room`);
//     });

//     socket.on('joinReservation', (data) => {
//       const { reservationId, userId } = data;
//       socket.join(reservationId);
//       console.log(`User ${userId} joined reservation room ${reservationId}`);
//     });

//     socket.on('sendMessage', async (data) => {
//       const { senderId, receiverId, content } = data;
//       io.to(receiverId).emit('newMessage', { senderId, receiverId, content });
//       console.log(`Message sent to ${receiverId}: ${content}`);
//     });

//     socket.on('updateLocation', async (data) => {
//       try {
//         const { prestataireId, reservationId, lat, lng } = data;
//         if (typeof lat !== 'number' || typeof lng !== 'number') {
//           throw new Error('Invalid coordinates');
//         }
//         const locationService = app.get(LocationService);
//         await locationService.updateLocation(prestataireId, reservationId, { lat, lng });
//         io.to(reservationId).emit(`locationUpdate-${reservationId}`, {
//           coordinates: { lat, lng },
//         });
//       } catch (e) {
//         console.error('Location update error:', e);
//       }
//     });

//     socket.on('disconnect', () => {
//       console.log('WebSocket disconnected:', socket.id);
//     });
//   });

//   // Inject services and pass io
//   const messagesService = app.get(MessagesService);
//   const locationService = app.get(LocationService);
//   const reservationsService = app.get(ReservationsService);
//   messagesService.setSocketIo(io);
//   locationService.setSocketIo(io);
//   reservationsService.setSocketIo(io);
// }

// bootstrap();