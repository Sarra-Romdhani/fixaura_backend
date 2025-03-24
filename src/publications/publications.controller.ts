import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { PublicationsService } from './publications.service';
import { Publication } from './publication.schema';

@Controller('publications')
export class PublicationsController {
  constructor(private readonly publicationsService: PublicationsService) {}

  @Post()
  create(@Body() body: any): Promise<Publication> {
    return this.publicationsService.create(body);
  }

  @Get()
  findAll(): Promise<Publication[]> {
    return this.publicationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Publication> {
    return this.publicationsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any): Promise<Publication> {
    return this.publicationsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.publicationsService.remove(id);
  }
}