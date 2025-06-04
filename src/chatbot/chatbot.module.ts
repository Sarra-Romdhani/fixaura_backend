// chatbot.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service'; // Si vous avez un service
import { Conversation, ConversationSchema } from './Conversation.schema';
import { MongooseModule } from '@nestjs/mongoose';
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Conversation.name, schema: ConversationSchema }]),
    HttpModule.register({ // Configuration essentielle
      timeout: 10000,
      maxRedirects: 3,
    }),
  ],
  controllers: [ChatbotController],
  providers: [ChatbotService], // Si vous avez un service
})
export class ChatbotModule {}