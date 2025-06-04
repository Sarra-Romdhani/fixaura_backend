import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId, Types } from 'mongoose';
import { Facture } from './facture.schema';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FacturesService {
  private readonly logger = new Logger(FacturesService.name);

  constructor(@InjectModel(Facture.name) private factureModel: Model<Facture>) {}

  // factures.service.ts
// factures.service.ts
async createFacture(factureData: Partial<Facture>): Promise<Facture> {
  try {
    const existingFacture = await this.factureModel.findOne({
      reservationId: factureData.reservationId,
    }).exec();

    if (existingFacture) {
      this.logger.warn(`Facture already exists for reservation ${factureData.reservationId}: ${existingFacture._id}`);
      return existingFacture;
    }

    const newFacture = new this.factureModel(factureData);
    const savedFacture = await newFacture.save();
    this.logger.log(`Facture created: ${savedFacture._id}`);
    return savedFacture;
  } catch (error) {
    this.logger.error(`Error saving facture: ${error.message}`);
    throw new InternalServerErrorException('Error saving facture: ' + error.message);
  }
}

  async getFacturesByPrestataire(prestataireId: string): Promise<Facture[]> {
    this.logger.log(`Fetching factures for prestataire: ${prestataireId}`);

    if (!isValidObjectId(prestataireId)) {
      this.logger.error('Invalid prestataire ID');
      throw new BadRequestException('Invalid prestataire ID');
    }

    try {
      const factures = await this.factureModel.find({ prestataireId: new Types.ObjectId(prestataireId) }).populate('reservationId').exec();
      this.logger.log(`Found ${factures.length} factures`);
      return factures || [];
    } catch (error) {
      this.logger.error(`Error fetching factures: ${error.message}`);
      throw new InternalServerErrorException('Error fetching factures: ' + error.message);
    }
  }

  async getFactureById(id: string): Promise<Facture> {
    this.logger.log(`Fetching facture by ID: ${id}`);

    if (!isValidObjectId(id)) {
      this.logger.error('Invalid facture ID');
      throw new BadRequestException('Invalid facture ID');
    }

    try {
      const facture = await this.factureModel.findById(id).populate('reservationId').exec();
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

 // factures.service.ts
async saveFacturePdf(factureId: string, pdfBuffer: Buffer): Promise<string> {
  this.logger.log(`Saving PDF for facture: ${factureId}`);

  try {
    const facture = await this.getFactureById(factureId);
    const pdfDir = path.join(__dirname, '..', '..', 'factures');
    
    // Ensure the directory exists
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
      this.logger.log(`Created factures directory: ${pdfDir}`);
    }

    const pdfPath = path.join(pdfDir, `facture_${factureId}.pdf`);
    
    // Write the PDF file and verify
    fs.writeFileSync(pdfPath, pdfBuffer);
    if (!fs.existsSync(pdfPath)) {
      this.logger.error(`Failed to save PDF at: ${pdfPath}`);
      throw new InternalServerErrorException('Failed to save PDF file');
    }
    
    this.logger.log(`PDF saved to: ${pdfPath}`);

    // Update the facture with the correct pdfPath
    await this.factureModel.findByIdAndUpdate(
      factureId,
      { pdfPath: pdfPath },
      { new: true }
    ).exec();
    this.logger.log(`Facture ${factureId} updated with PDF path`);
    
    return pdfPath;
  } catch (error) {
    this.logger.error(`Error saving facture PDF: ${error.message}`);
    throw new InternalServerErrorException(`Error saving facture PDF: ${error.message}`);
  }
}

  async getFacturePdfPath(factureId: string): Promise<string> {
    this.logger.log(`Fetching PDF path for facture: ${factureId}`);

    try {
      const facture = await this.getFactureById(factureId);
      if (!facture.pdfPath || !fs.existsSync(facture.pdfPath)) {
        this.logger.warn(`PDF for facture ${factureId} not found`);
        throw new NotFoundException(`PDF for facture ${factureId} not found`);
      }
      this.logger.log(`PDF path found: ${facture.pdfPath}`);
      return facture.pdfPath;
    } catch (error) {
      this.logger.error(`Error fetching PDF path: ${error.message}`);
      throw new InternalServerErrorException('Error fetching PDF path: ' + error.message);
    }
  }
  
}