import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Conversation, ConversationDocument } from './Conversation.schema';

@Controller('chatbot')
export class ChatbotController {
  constructor(
    private readonly httpService: HttpService,
    @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
  ) {}

  @Post('message')
  async handleMessage(@Body() body: { userId: string; message: string; language: string }): Promise<any> {
    try {
      if (!body.userId || !body.message || !['fr', 'en', 'tn'].includes(body.language)) {
        throw new HttpException('Invalid input', HttpStatus.BAD_REQUEST);
      }

      // Normalize Tunisian input
      let processedMessage = body.message;
      if (body.language === 'tn') {
        processedMessage = processedMessage
          .replace(/7/g, 'ḥ')
          .replace(/3/g, 'ʿ')
          .replace(/9/g, 'q')
          .replace(/[Hh][Aa][Yy][Yy][Aa]/g, 'ḥayyā')
          .replace(/[Cc][Hh][Bb][Rr]/g, 'chbār')
          .replace(/[Cc][Hh][Uu][Kk][Rr][Aa][Nn]/g, 'chukrān');
      }

      const flaskUrl = 'http://127.0.0.1:8000/chatbot/message';
      const response = await firstValueFrom(
        this.httpService.post(flaskUrl, {
          userId: body.userId,
          message: processedMessage,
          language: body.language,
        }, {
          timeout: 60000, // Increased timeout for LLaMA
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        }),
      );

      const data = response.data;
      if (!data.response) throw new Error('Invalid server response');

      await this.conversationModel.findOneAndUpdate(
        { userId: body.userId },
        {
          $push: {
            messages: [
              { text: body.message, isUser: true, timestamp: new Date() },
              { text: data.response, isUser: false, timestamp: new Date() },
            ],
          },
          $set: { 
            lastLanguage: body.language, 
            updatedAt: new Date(),
            ...(body.language === 'tn' && { direction: 'rtl' })
          },
        },
        { upsert: true, new: true },
      );

      // Process Tunisian response
      if (body.language === 'tn') {
        data.response = data.response
          .replace(/7/g, 'ḥ')
          .replace(/3/g, 'ʿ')
          .replace(/9/g, 'q')
          .replace(/[Hh][Aa][Yy][Yy][Aa]/g, 'ḥayyā')
          .replace(/[Cc][Hh][Bb][Rr]/g, 'chbār')
          .replace(/[Cc][Hh][Uu][Kk][Rr][Aa][Nn]/g, 'chukrān')
          .replace(/\s+/g, ' ')
          .trim();
      }

      return data;
    } catch (error) {
      console.error('Error in handleMessage:', error);
      return {
        response: this.getLocalizedError(body.language),
        language: body.language,
        error: error.message,
      };
    }
  }

  private getLocalizedError(lang: string): string {
    const errors = {
      tn: 'Problème technique! Essa3 marra okhra.',
      en: 'Technical issue! Please try again later.',
      fr: 'Problème technique ! Veuillez réessayer plus tard.',
    };
    return errors[lang] || errors.fr;
  }
}