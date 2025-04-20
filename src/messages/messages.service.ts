import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message } from './message.schema';
import { Server } from 'socket.io';
import { Client } from 'src/clients/client.schema';
import { Prestataire } from 'src/prestataires/prestataire.schema';

interface SenderProfile {
  name: string;
  image: string;
}

@Injectable()
export class MessagesService {
  private io: Server | null = null;

  constructor(
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @InjectModel('Client') private clientModel: Model<Client>,
    @InjectModel('Prestataire') private prestataireModel: Model<Prestataire>,
  ) {}

  setSocketIo(io: Server) {
    this.io = io;
  }

  async createMessage(senderId: string, receiverId: string, content: string): Promise<Message> {
    const message = await this.messageModel.create({
      senderId: new Types.ObjectId(senderId),
      receiverId: new Types.ObjectId(receiverId),
      content,
      isRead: false,
    });

    if (this.io) {
      const roomId = [senderId, receiverId].sort().join('-');
      const sender = await this.getSenderProfile(senderId);
      this.io.to(roomId).emit('newMessage', {
        _id: message._id,
        senderId: message.senderId.toString(),
        receiverId: message.receiverId.toString(),
        content: message.content,
        isLocationCard: message.isLocationCard,
        location: message.location,
        reservationId: message.reservationId?.toString(),
        isRatingPrompt: message.isRatingPrompt,
        createdAt: message.createdAt.toISOString(),
        isRead: message.isRead,
        name: sender.name,
        image: sender.image,
      });
      console.log(`Emitted newMessage to room ${roomId}: ID=${message._id}`);
    } else {
      console.warn('Socket.IO not initialized, message not emitted');
    }

    return message;
  }

  async getMessagesBetweenUsers(user1Id: string, user2Id: string): Promise<Message[]> {
    return this.messageModel
      .find({
        $or: [
          { senderId: new Types.ObjectId(user1Id), receiverId: new Types.ObjectId(user2Id) },
          { senderId: new Types.ObjectId(user2Id), receiverId: new Types.ObjectId(user1Id) },
        ],
      })
      .sort({ createdAt: 1 })
      .exec();
  }

  async markMessagesAsRead(senderId: string, receiverId: string): Promise<void> {
    await this.messageModel
      .updateMany(
        {
          senderId: new Types.ObjectId(senderId),
          receiverId: new Types.ObjectId(receiverId),
          isRead: false,
        },
        { $set: { isRead: true } },
      )
      .exec();
  }

  async markMessagesAsReadByIds(messageIds: string[], readerId: string): Promise<void> {
    const updatedMessages = await this.messageModel
      .updateMany(
        {
          _id: { $in: messageIds.map((id) => new Types.ObjectId(id)) },
          receiverId: new Types.ObjectId(readerId),
          isRead: false,
        },
        { $set: { isRead: true } },
      )
      .exec();

    if (this.io && updatedMessages.modifiedCount > 0) {
      const messages = await this.messageModel
        .find({
          _id: { $in: messageIds.map((id) => new Types.ObjectId(id)) },
        })
        .exec();
      const roomIds = [...new Set(
        messages.map((msg) => [msg.senderId.toString(), msg.receiverId.toString()].sort().join('-'))
      )];
      for (const roomId of roomIds) {
        this.io.to(roomId).emit('messages-read', messageIds);
        console.log(`Emitted messages-read to room ${roomId}: ${messageIds}`);
      }
    }
  }

  async getConversations(userId: string): Promise<any[]> {
    const conversations = await this.messageModel
      .aggregate([
        {
          $match: {
            $or: [{ senderId: new Types.ObjectId(userId) }, { receiverId: new Types.ObjectId(userId) }],
          },
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $group: {
            _id: {
              $cond: [
                { $eq: ['$senderId', new Types.ObjectId(userId)] },
                '$receiverId',
                '$senderId',
              ],
            },
            lastMessage: { $first: '$content' },
            lastMessageTimestamp: { $first: '$createdAt' },
            unreadCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$receiverId', new Types.ObjectId(userId)] },
                      { $eq: ['$isRead', false] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ])
      .exec();

    for (const conv of conversations) {
      const profile = await this.getSenderProfile(conv._id.toString());
      conv.name = profile.name;
      conv.image = profile.image?.startsWith('/') ? profile.image : `/${profile.image}`;
      conv.senderId = conv._id.toString();
      console.log(`Conversation enriched: ${JSON.stringify(conv)}`);
    }

    return conversations;
  }

  async getSenderProfile(senderId: string): Promise<SenderProfile> {
    let profile: Client | Prestataire | null = await this.clientModel.findById(senderId).lean();
    if (!profile) {
      profile = await this.prestataireModel.findById(senderId).lean();
    }
    const result = profile && profile.name
      ? { name: profile.name, image: profile.image || '' }
      : { name: 'Unknown User', image: '' };
    console.log(`Sender ${senderId}: name=${result.name}, image=${result.image}`);
    return result;
  }

  async saveMessage(
    senderId: string,
    receiverId: string,
    content: string,
    isLocationCard: boolean = false,
    location?: { lat: number; lng: number },
    reservationId?: string,
    isRatingPrompt: boolean = false,
  ): Promise<Message> {
    const message = new this.messageModel({
      senderId: new Types.ObjectId(senderId),
      receiverId: new Types.ObjectId(receiverId),
      content,
      isLocationCard,
      location,
      reservationId,
      isRatingPrompt,
      createdAt: new Date(),
      isRead: false,
    });

    const savedMessage = await message.save();
    console.log(`Saved message: ID=${savedMessage._id}, to=${receiverId}, content="${content}", isRatingPrompt=${isRatingPrompt}`);

    if (this.io) {
      const roomId = [senderId, receiverId].sort().join('-');
      const sender = await this.getSenderProfile(senderId);
      this.io.to(roomId).emit('newMessage', {
        _id: savedMessage._id,
        senderId: savedMessage.senderId.toString(),
        receiverId: savedMessage.receiverId.toString(),
        content: savedMessage.content,
        isLocationCard: savedMessage.isLocationCard,
        location: savedMessage.location,
        reservationId: savedMessage.reservationId?.toString(),
        isRatingPrompt: savedMessage.isRatingPrompt,
        createdAt: savedMessage.createdAt.toISOString(),
        isRead: savedMessage.isRead,
        name: sender.name,
        image: sender.image,
      });
      console.log(`Emitted newMessage to room ${roomId}: ID=${savedMessage._id}`);
    } else {
      console.warn('Socket.IO not initialized, message not emitted');
    }

    return savedMessage;
  }
}