import { Controller, Get, Post, Param, NotFoundException, InternalServerErrorException, BadRequestException, Logger, Body, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { FacturesService } from './factures.service';
import { Facture } from './facture.schema';
import { FileInterceptor } from '@nestjs/platform-express';
import { isValidObjectId } from 'mongoose';
import { Response } from 'express';
import * as fs from 'fs';
@Controller('factures')
export class FacturesController {
  private readonly logger = new Logger(FacturesController.name);

  constructor(private readonly facturesService: FacturesService) {}
  @Post()
  async createFacture(@Body() factureData: Partial<Facture>) {
    this.logger.log(`Creating facture with data: ${JSON.stringify(factureData)}`);
    try {
      const createdFacture = await this.facturesService.createFacture(factureData);
      this.logger.log(`Facture created: ${createdFacture._id}`);
      return createdFacture; // Ensure this returns { _id, ...otherFields }
    } catch (error) {
      this.logger.error(`Error creating facture: ${error.message}`);
      throw new InternalServerErrorException('Error creating facture: ' + error.message);
    }
  }
  
  @Post(':id/upload')
  @UseInterceptors(FileInterceptor('pdf'))
  async uploadFacturePdf(@Param('id') id: string, @UploadedFile() pdf: Express.Multer.File) {
    this.logger.log(`Uploading PDF for facture: ${id}`);
    try {
      const pdfPath = await this.facturesService.saveFacturePdf(id, pdf.buffer);
      this.logger.log(`PDF uploaded: ${pdfPath}`);
      return { success: true, pdfPath };
    } catch (error) {
      this.logger.error(`Error uploading PDF: ${error.message}`);
      throw new InternalServerErrorException('Error uploading PDF: ' + error.message);
    }
  }

  @Get('prestataire/:prestataireId')
  async getFacturesByPrestataire(@Param('prestataireId') prestataireId: string): Promise<Facture[]> {
    this.logger.log(`Fetching factures for prestataire: ${prestataireId}`);
    if (!isValidObjectId(prestataireId)) {
      this.logger.error('Invalid prestataire ID');
      throw new BadRequestException('Invalid prestataire ID');
    }
    try {
      const factures = await this.facturesService.getFacturesByPrestataire(prestataireId);
      this.logger.log(`Found ${factures.length} factures`);
      return factures;
    } catch (error) {
      this.logger.error(`Error fetching factures: ${error.message}`);
      throw new InternalServerErrorException('Error fetching factures: ' + error.message);
    }
  }



  @Get(':id')
  async getFactureById(@Param('id') id: string): Promise<Facture> {
    this.logger.log(`Fetching facture by ID: ${id}`);

    if (!isValidObjectId(id)) {
      this.logger.error('Invalid facture ID');
      throw new BadRequestException('Invalid facture ID');
    }

    try {
      const facture = await this.facturesService.getFactureById(id);
      if (!facture) {
        this.logger.warn(`Facture with ID ${id} not found`);
        throw new NotFoundException(`Facture with ID ${id} not found`);
      }
      this.logger.log(`Facture found: ${id}`);
      return facture;
    } catch (error) {
      this.logger.error(`Error fetching facture: ${error.message}`);
      throw new InternalServerErrorException('Error fetching facture: ' + error.message);
    }
  }
@Get(':id/pdf')
  async getFacturePdf(@Param('id') id: string, @Res() res: Response): Promise<void> {
    try {
      const pdfPath = await this.facturesService.getFacturePdfPath(id);
      if (!fs.existsSync(pdfPath)) {
        throw new NotFoundException(`PDF file not found for facture ${id}`);
      }

      // Set headers for PDF response
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=facture_${id}.pdf`,
      });

      // Stream the PDF file
      const fileStream = fs.createReadStream(pdfPath);
      fileStream.pipe(res);
    } catch (error) {
      throw new NotFoundException(`Error retrieving PDF for facture ${id}: ${error.message}`);
    }
  }
}