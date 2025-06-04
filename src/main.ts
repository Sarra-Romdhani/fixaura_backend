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

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      bodyLimit: 50 * 1024 * 1024, // 50MB limit for the entire request
    }),
  );

  // Register fastify-multipart
  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
      files: 1, // Limit to one file
      fieldSize: 1000000, // 1MB for fields
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
  const uploadDirs = ['./Uploads', './Uploads/publications'];
  uploadDirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe());

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
    });
  });

  // Inject services and pass io
  const messagesService = app.get(MessagesService);
  const locationService = app.get(LocationService);
  const reservationsService = app.get(ReservationsService);
  messagesService.setSocketIo(io);
  locationService.setSocketIo(io);
  reservationsService.setSocketIo(io);
}

bootstrap();