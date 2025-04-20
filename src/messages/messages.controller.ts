import { Controller, Post, Get, Body, Query, Put } from '@nestjs/common';
import { MessagesService } from './messages.service';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  async sendMessage(
    @Body('senderId') senderId: string,
    @Body('receiverId') receiverId: string,
    @Body('content') content: string,
  ) {
    return this.messagesService.createMessage(senderId, receiverId, content);
  }

  @Get()
  async getMessages(
    @Query('user1Id') user1Id: string,
    @Query('user2Id') user2Id: string,
  ) {
    return this.messagesService.getMessagesBetweenUsers(user1Id, user2Id);
  }

  @Get('conversations')
  async getConversations(@Query('userId') userId: string) {
    const conversations = await this.messagesService.getConversations(userId);
    return conversations.map((conv) => ({
      _id: conv._id,
      name: conv.name,
      image: conv.image,
      lastMessage: conv.lastMessage,
      lastMessageTimestamp: conv.lastMessageTimestamp,
      unreadCount: conv.unreadCount,
      senderId: conv.senderId,
    }));
  }

  @Put('markAsRead')
  async markMessagesAsRead(
    @Body('messageIds') messageIds: string[],
    @Body('readerId') readerId: string,
  ) {
    await this.messagesService.markMessagesAsReadByIds(messageIds, readerId);
    return { success: true };
  }
}