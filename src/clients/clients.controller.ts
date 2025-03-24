import { Controller, Get, Param, NotFoundException, Body, Put } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { Client } from './client.schema';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get(':id')
  async getClientProfile(@Param('id') id: string) {
    try {
      const client = await this.clientsService.getClientProfile(id);
      return {
        success: true,
        data: client,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('Error retrieving client profile');
    }
  }

  @Put(':id') // or @Put(':id') depending on your preference
  async updateClient(
    @Param('id') id: string,
    @Body() updateData: Partial<Client>,
  ) {
    try {
      const updatedClient = await this.clientsService.updateClient(id, updateData);
      return {
        success: true,
        data: updatedClient,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('Error updating client profile');
    }
  }
}