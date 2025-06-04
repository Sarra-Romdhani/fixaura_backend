// import { Controller, Post, Body, HttpException, HttpStatus, Logger } from '@nestjs/common';
// import { HttpService } from '@nestjs/axios';
// import { firstValueFrom } from 'rxjs';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { Conversation, ConversationDocument } from './Conversation.schema';

// @Controller('chatbot')
// export class ChatbotController {
//   private readonly logger = new Logger(ChatbotController.name);

//   constructor(
//     private readonly httpService: HttpService,
//     @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
//   ) {}

//   private getErrorMessage(lang: string): string {
//     const errors = {
//       tn: 'مشكلة تقنية! جربي مرة أخرى.',
//       en: 'Technical issue! Try again later.',
//       fr: 'Problème technique ! Réessayez plus tard.',
//       ar: 'مشكلة تقنية! حاول مرة أخرى لاحقًا.',
//     };
//     return errors[lang] || errors.fr;
//   }

//   @Post('message')
//   async handleMessage(
//     @Body() body: { userId: string; message: string; language: string; conversationId?: string },
//   ): Promise<{ response: string; conversationId: string }> {
//     this.logger.log(`Received: ${body.message}, lang: ${body.language}`);
//     try {
//       if (!body.userId || !body.message || !['fr', 'en', 'tn', 'ar'].includes(body.language)) {
//         throw new HttpException('Invalid input', HttpStatus.BAD_REQUEST);
//       }

//       const fastApiUrl = 'http://127.0.0.1:8000/chatbot/message';
//       let response;
//       try {
//         response = await firstValueFrom(
//           this.httpService.post(
//             fastApiUrl,
//             { message: body.message, language: body.language },
//             { timeout: 120000, headers: { 'Content-Type': 'application/json' } },
//           ),
//         );
//       } catch (error) {
//         this.logger.error(`FastAPI error: ${error.message}`);
//         throw new Error('AI service failed');
//       }

//       const finalResponse = response.data.response || this.getErrorMessage(body.language);

//       let conversation: ConversationDocument;
//       if (body.conversationId) {
//         const updatedConversation = await this.conversationModel.findOneAndUpdate(
//           { _id: body.conversationId, userId: body.userId },
//           {
//             $push: {
//               messages: [
//                 { text: body.message, isUser: true, timestamp: new Date() },
//                 { text: finalResponse, isUser: false, timestamp: new Date() },
//               ],
//             },
//             $set: {
//               lastLanguage: body.language,
//               updatedAt: new Date(),
//               direction: ['ar', 'tn'].includes(body.language) ? 'rtl' : 'ltr',
//             },
//           },
//           { new: true },
//         );
//         if (!updatedConversation) {
//           throw new HttpException('Conversation not found', HttpStatus.NOT_FOUND);
//         }
//         conversation = updatedConversation;
//       } else {
//         conversation = await this.conversationModel.create({
//           userId: body.userId,
//           messages: [
//             { text: body.message, isUser: true, timestamp: new Date() },
//             { text: finalResponse, isUser: false, timestamp: new Date() },
//           ],
//           lastLanguage: body.language,
//           updatedAt: new Date(),
//           direction: ['ar', 'tn'].includes(body.language) ? 'rtl' : 'ltr',
//         });
//       }

//       return { response: finalResponse, conversationId: conversation.id.toString() };
//     } catch (error) {
//       this.logger.error(`Error: ${error.message}`);
//       throw new HttpException(
//         { response: this.getErrorMessage(body?.language || 'fr'), error: error.message },
//         HttpStatus.INTERNAL_SERVER_ERROR,
//       );
//     }
//   }
// }

import { Controller, Post, Get, Body, Param, HttpException, HttpStatus, Logger, Delete } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Conversation, ConversationDocument } from './Conversation.schema';

@Controller('chatbot')
export class ChatbotController {
  private readonly logger = new Logger(ChatbotController.name);

  constructor(
    private readonly httpService: HttpService,
    @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
  ) {}

  private getErrorMessage(lang: string): string {
    const errors = {
      tn: 'مشكلة تقنية! جربي مرة أخرى.',
      en: 'Technical issue! Try again later.',
      fr: 'Problème technique ! Réessayez plus tard.',
      ar: 'مشكلة تقنية! حاول مرة أخرى لاحقًا.',
    };
    return errors[lang] || errors.fr;
  }

 @Get('conversations/:userId')
async getConversations(@Param('userId') userId: string): Promise<{ conversations: ConversationDocument[] }> {
  if (!userId) {
    throw new HttpException('userId is required', HttpStatus.BAD_REQUEST);
  }
  try {
    const conversations = await this.conversationModel
      .find({ userId })
      .sort({ updatedAt: -1 })
      .limit(50)
      .exec();
    return { conversations }; // Wrap the list in an object
  } catch (error) {
    this.logger.error(`Error fetching conversations for user ${userId}: ${error.message}`);
    throw new HttpException('Failed to fetch conversations', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

  @Get('conversations/:userId/:id')
  async getConversationById(@Param('userId') userId: string, @Param('id') id: string): Promise<ConversationDocument> {
    if (!userId || !id) {
      throw new HttpException('userId and id are required', HttpStatus.BAD_REQUEST);
    }
    try {
      const conversation = await this.conversationModel.findOne({ _id: id, userId }).exec();
      if (!conversation) {
        throw new HttpException('Conversation not found', HttpStatus.NOT_FOUND);
      }
      return conversation;
    } catch (error) {
      this.logger.error(`Error fetching conversation ${id} for user ${userId}: ${error.message}`);
      throw new HttpException('Failed to fetch conversation', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete('conversations/:userId/:id')
  async deleteConversation(@Param('userId') userId: string, @Param('id') id: string): Promise<{ message: string }> {
    if (!userId || !id) {
      throw new HttpException('userId and id are required', HttpStatus.BAD_REQUEST);
    }
    try {
      const result = await this.conversationModel.deleteOne({ _id: id, userId }).exec();
      if (result.deletedCount === 0) {
        throw new HttpException('Conversation not found', HttpStatus.NOT_FOUND);
      }
      return { message: 'Conversation deleted successfully' };
    } catch (error) {
      this.logger.error(`Error deleting conversation ${id} for user ${userId}: ${error.message}`);
      throw new HttpException('Failed to delete conversation', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('message')
  async handleMessage(
    @Body() body: { userId: string; message: string; language: string; conversationId?: string },
  ): Promise<{ response: string; conversationId: string }> {
    this.logger.log(`Received: ${body.message}, lang: ${body.language}`);
    try {
      if (!body.userId || !body.message || !['fr', 'en', 'tn', 'ar'].includes(body.language)) {
        throw new HttpException('Invalid input: userId, message, and valid language are required', HttpStatus.BAD_REQUEST);
      }

      const fastApiUrl = 'http://127.0.0.1:8000/chatbot/message';
      let response;
      try {
        response = await firstValueFrom(
          this.httpService.post(
            fastApiUrl,
            { message: body.message, language: body.language },
            { timeout: 120000, headers: { 'Content-Type': 'application/json' } },
          ),
        );
      } catch (error) {
        this.logger.error(`FastAPI error: ${error.message}`);
        throw new HttpException('AI service failed', HttpStatus.SERVICE_UNAVAILABLE);
      }

      const finalResponse = response.data.response || this.getErrorMessage(body.language);

      let conversation: ConversationDocument;
      if (body.conversationId) {
        const updatedConversation = await this.conversationModel.findOneAndUpdate(
          { _id: body.conversationId, userId: body.userId },
          {
            $push: {
              messages: [
                { text: body.message, isUser: true, timestamp: new Date() },
                { text: finalResponse, isUser: false, timestamp: new Date() },
              ],
            },
            $set: {
              lastLanguage: body.language,
              updatedAt: new Date(),
              direction: ['ar', 'tn'].includes(body.language) ? 'rtl' : 'ltr',
            },
          },
          { new: true },
        );
        if (!updatedConversation) {
          throw new HttpException('Conversation not found', HttpStatus.NOT_FOUND);
        }
        conversation = updatedConversation;
      } else {
        conversation = await this.conversationModel.create({
          userId: body.userId,
          messages: [
            { text: body.message, isUser: true, timestamp: new Date() },
            { text: finalResponse, isUser: false, timestamp: new Date() },
          ],
          lastLanguage: body.language,
          updatedAt: new Date(),
          direction: ['ar', 'tn'].includes(body.language) ? 'rtl' : 'ltr',
        });
      }

      return { response: finalResponse, conversationId: conversation.id.toString() };
    } catch (error) {
      this.logger.error(`Error: ${error.message}`);
      throw new HttpException(
        { response: this.getErrorMessage(body?.language || 'fr'), error: error.message },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}