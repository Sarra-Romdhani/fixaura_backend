import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';
import fastifyStatic from '@fastify/static';
import { Server } from 'socket.io';
import { MessagesService } from './messages/messages.service';
import fastifyMultipart from 'fastify-multipart';
import { LocationService } from './locations/locations.service';
import { ReservationsService } from './reservations/reservations.service';
import * as fs from 'fs';
import { ServeStaticModule } from '@nestjs/serve-static';
async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      bodyLimit: 50 * 1024 * 1024, // 50MB limit for the entire request
    }),
  );

  // Enable CORS for Flutter app
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });


  
  // app.register(fastifyMultipart, {
  //   limits: {
  //     fileSize: 10000000, // 10MB limit
  //   },
  // })
  // // Serve static files (e.g., profile images)
  // app.register(fastifyStatic, {
  //   root: join(__dirname, '..', 'uploads'),
  //   prefix: '/uploads/',
  // });
// Register fastify-multipart with debugging
// Register fastify-multipart
// try {
//   await app.register(fastifyMultipart, {
//     limits: {
//       fileSize: 10 * 1024 * 1024, // 10MB
//       files: 1,
//     },
//     addToBody: true, // Attach fields to req.body
//   });
//   console.log('fastify-multipart registered successfully');
// } catch (error) {
//   console.error('Failed to register fastify-multipart:', error);
//   throw error;
// }


// Serve static files for uploads
// app.register(require('@fastify/static'), {
//   root: join(__dirname, '..', 'Uploads'),
//   prefix: '/uploads/',
// });
 
   // Configure Express middleware
   
const uploadDirs = ['./uploads/publications'];
  uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });








  // Global validation pipe (if needed)
  app.useGlobalPipes(new ValidationPipe());

  // Start the server and get the underlying Fastify instance
  await app.listen(3000, '0.0.0.0');
  console.log(`Application is running on: ${await app.getUrl()}`);

  // Get the underlying Fastify server instance
  const fastifyInstance = app.getHttpAdapter().getInstance();

  // Initialize Socket.IO with the Fastify server
  const io = new Server(fastifyInstance.server, {
    cors: {
      origin: '*', // Allow Flutter app to connect
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
    // New joinReservation event
    socket.on('joinReservation', (data) => {
      const { reservationId, userId } = data;
      socket.join(reservationId);
      console.log(`User ${userId} joined reservation room ${reservationId}`);
    });

    socket.on('sendMessage', async (data) => {
      const { senderId, receiverId, content } = data;
      // Emit the message to the receiver’s room
      io.to(receiverId).emit('newMessage', { senderId, receiverId, content });
      console.log(`Message sent to ${receiverId}: ${content}`);
    });
    // New updateLocation event
  // Modify the updateLocation handler
  socket.on('updateLocation', async (data) => {
    try {
      const { prestataireId, reservationId, lat, lng } = data;
      
      // Validate coordinates
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        throw new Error('Invalid coordinates');
      }
  
      await locationService.updateLocation(prestataireId, reservationId, { lat, lng });
      
      // Emit to specific reservation room
      io.to(reservationId).emit('locationUpdate-${reservationId}', {
        coordinates: { lat, lng }
      });
    } catch (e) {
      console.error('Location update error:', e);
    }
  });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected:', socket.id);
    });


    // io.on('connection', (socket) => {
    //   socket.on('joinRoom', (roomId) => {
    //     socket.join(roomId);
    //     console.log(`Socket ${socket.id} joined room ${roomId}`);
    //   });
    // });
  });
  
  // Optional: Inject MessagesService to emit messages when saved
  const messagesService = app.get(MessagesService);
  const locationService = app.get(LocationService); // Add LocationService
  const reservationsService = app.get(ReservationsService);

  // Example integration (you’d call this from MessagesService when a message is saved)
  // messagesService.onNewMessage = (message) => {
  //   io.to(message.receiverId).emit('newMessage', message);
  // };
  // Pass io to services
  messagesService.setSocketIo(io);
  locationService.setSocketIo(io);
  reservationsService.setSocketIo(io);

}

bootstrap();