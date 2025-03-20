// src/services/services.controller.ts
import { Controller, Post, Put, Delete, Body, Param, HttpCode } from '@nestjs/common';
import { ServicesService } from './services.service';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post('addService')
  @HttpCode(201)
  async addService(
    @Body()
    body: {
      title: string;
      description: string;
      price: number;
      estimatedDuration: number;
      photo: string;
      prestataireId: string;
    },
  ) {
    const service = await this.servicesService.addService(
      body.title,
      body.description,
      body.price,
      body.estimatedDuration,
      body.photo,
      body.prestataireId,
    );
    return {
      success: true,
      message: 'Service added successfully',
      data: service,
    };
  }

  @Put('updateService/:id')
  @HttpCode(200)
  async updateService(
    @Param('id') id: string,
    @Body()
    body: {
      title: string;
      description: string;
      price: number;
      estimatedDuration: number;
      photo: string;
      prestataireId: string;
    },
  ) {
    const service = await this.servicesService.updateService(
      id,
      body.title,
      body.description,
      body.price,
      body.estimatedDuration,
      body.photo,
      body.prestataireId,
    );
    return {
      success: true,
      message: 'Service updated successfully',
      data: service,
    };
  }

  @Delete('deleteService/:id')
  @HttpCode(200)
  async deleteService(@Param('id') id: string) {
    await this.servicesService.deleteService(id);
    return {
      success: true,
      message: 'Service deleted successfully',
    };
  }
}