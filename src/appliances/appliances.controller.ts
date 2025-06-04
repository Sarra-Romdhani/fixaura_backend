import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Delete, 
  Param, 
  Body, 
  HttpException, 
  HttpStatus, 
  NotFoundException
} from '@nestjs/common';
import { AppliancesService } from './appliances.service';
import { ValidateObjectIdPipe } from './validate-object-id.pipe';

@Controller('appliances')
export class AppliancesController {
  constructor(private readonly appliancesService: AppliancesService) {}

  @Post()
  async create(@Body() applianceData: any) {
    try {
      const requiredFields = ['userId', 'modele', 'brand', 'purchaseDate'];
      const missing = requiredFields.filter(field => !applianceData[field]);
      if (missing.length) {
        throw new HttpException(
          `Missing required fields: ${missing.join(', ')}`,
          HttpStatus.BAD_REQUEST
        );
      }

      const appliance = await this.appliancesService.create(applianceData);
      console.log(`Created appliance: ${appliance._id}`);
      return { 
        status: 'success',
        data: appliance 
      };
    } catch (error) {
      console.error(`Create error: ${error.message}`);
      throw new HttpException(
        error.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('user/:userId')
  async getUserAppliances(@Param('userId') userId: string) {
    try {
      const appliances = await this.appliancesService.findByUserId(userId);
      return { 
        status: 'success',
        count: appliances.length,
        data: appliances 
      };
    } catch (error) {
      console.error(`Get user appliances error: ${error.message}`);
      throw new HttpException(
        error.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  async getAppliance(@Param('id', ValidateObjectIdPipe) id: string) {
    try {
      const appliance = await this.appliancesService.findById(id);
      return { 
        status: 'success',
        data: appliance 
      };
    } catch (error) {
      console.error(`Get appliance error: ${error.message}`);
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Patch(':id')
  async updateAppliance(
    @Param('id', ValidateObjectIdPipe) id: string,
    @Body() updateData: any
  ) {
    try {
      const updated = await this.appliancesService.update(id, updateData);
      console.log(`Updated appliance: ${id}`);
      return { 
        status: 'success',
        data: updated 
      };
    } catch (error) {
      console.error(`Update error: ${error.message}`);
      throw new HttpException(
        error.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':id')
  async deleteAppliance(@Param('id', ValidateObjectIdPipe) id: string) {
    try {
      console.log(`Attempting to delete appliance ID: ${id}`);
      await this.appliancesService.delete(id);
      return { 
        status: 'success',
        message: 'Appliance deleted successfully' 
      };
    } catch (error) {
      console.error(`Delete error ID ${id}: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: 'Appliance not found',
            error: 'Not Found'
          },
          HttpStatus.NOT_FOUND
        );
      }
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
          error: 'Internal Server Error'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id/history')
  async getApplianceHistory(@Param('id', ValidateObjectIdPipe) id: string) {
    try {
      const history = await this.appliancesService.getHistory(id);
      return { 
        status: 'success',
        count: history.length,
        data: history 
      };
    } catch (error) {
      console.error(`Get history error: ${error.message}`);
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}