
import { Controller, Get, Param, NotFoundException, Body, Put, UnauthorizedException, Query, Req, BadRequestException } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { Client } from './client.schema';
import { FastifyRequest } from 'fastify';

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
  
  @Put(':id')
  async updateClient(
    @Param('id') id: string,
    @Req() req: FastifyRequest,
  ) {
    try {
      // Extract the file using req.file()
      const fileData = await req.file();
      let file: { file: any; filename: string } | undefined;
      if (fileData) {
        file = { file: fileData.file, filename: fileData.filename };
      }

      // Extract fields from req.body (already parsed by @fastify/multipart)
      const updateData: Partial<Client> = req.body || {};

      const updatedClient = await this.clientsService.updateClient(id, updateData, file);
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

  @Get('/search')
  async searchClients(@Query('query') query: string, @Query('excludeId') excludeId: string) {
    const clients = await this.clientsService.searchClients(query, excludeId);
    return {
      success: true,
      data: clients,
    };
  }
  
  @Put(':id/password')
  async updateClientPassword(@Param('id') id: string, @Body() body: { currentPassword: string; newPassword: string }) {
    try {
      await this.clientsService.updateClientPassword(id, body.currentPassword, body.newPassword);
      return {
        success: true,
        message: 'Password updated successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error;
      }
      throw new NotFoundException('Error updating password');
    }
  }

  @Put(':id/delete')
  async deleteClient(@Param('id') id: string, @Body('reason') reason: string) {
    if (!reason) {
      throw new BadRequestException('Deletion reason is required');
    }
    await this.clientsService.deleteClient(id, reason);
    return { success: true, message: `Client ${id} supprimé avec succès. Raison: ${reason}` };
  }

  @Put(':id/flag')
  async flagClient(@Param('id') id: string, @Body('reason') reason: string) {
    if (!reason) {
      throw new BadRequestException('Flag reason is required');
    }
    await this.clientsService.flagClient(id, reason);
    return { success: true, message: `Client ${id} signalé avec succès. Raison: ${reason}` };
  }

  @Get()
  async getAllClients() {
    try {
      const clients = await this.clientsService.getAllClients();
      return {
        success: true,
        data: clients,
      };
    } catch (error) {
      throw new NotFoundException('Error retrieving clients');
    }
  }

  @Get('/deleted')
  async getDeletedClients() {
    try {
      const deletedClients = await this.clientsService.getDeletedClients();
      return {
        success: true,
        data: deletedClients,
      };
    } catch (error) {
      throw new NotFoundException('Error retrieving deleted clients');
    }
  }
}