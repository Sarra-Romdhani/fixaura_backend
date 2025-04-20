import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller'; // If you have one
import { Message, MessageSchema } from './message.schema'; // Adjust path
import { ClientsModule } from '../clients/clients.module'; // Import ClientsModule
import { PrestatairesModule } from '../prestataires/prestataires.module'; // Import PrestatairesModule

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
    ClientsModule, // Provides ClientModel
    PrestatairesModule, // Provides PrestataireModel
  ],
  providers: [MessagesService],
  controllers: [MessagesController], // If you have a controller
  exports: [MessagesService], // If needed elsewhere
})
export class MessagesModule {}