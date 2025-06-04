import { Controller, Get, Post, Put, Delete, Query, Body, Param, NotFoundException, BadRequestException, HttpException, HttpStatus, HttpCode, Logger, InternalServerErrorException } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { Reservation } from './reservation.schema';
import { isValidObjectId } from 'mongoose';
import { MessagesService } from 'src/messages/messages.service';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Controller('reservations')
export class ReservationsController {
  private transporter: nodemailer.Transporter | null = null;
private readonly logger = new Logger(ReservationsService.name);
  constructor(
    private readonly reservationsService: ReservationsService,
    private readonly messagesService: MessagesService,
    private configService: ConfigService,
  ) {
  
  }


  @Post()
  async createReservation(@Body() reservationData: Partial<Reservation>) {
    const reservation = await this.reservationsService.createReservation(reservationData);
    return { success: true, data: reservation };
  }

  @Get()
  async getAllReservations() {
    const reservations = await this.reservationsService.getAllReservations();
    return { success: true, data: reservations };
  }

 

  @Get('client/:id_client')
  async getReservationsByClient(@Param('id_client') id_client: string) {
    const reservations = await this.reservationsService.getReservationsByClient(id_client);
    return { success: true, data: reservations };
  }

  // @Get('client/:id/completed')
  // async getCompletedReservationsByClient(@Param('id') id_client: string): Promise<Reservation[]> {
  //   return this.reservationsService.getCompletedReservationsByClient(id_client);
  // }

  // 
  @Get('client/:id_client/completed')
  async getCompletedReservationsByClient(@Param('id_client') id_client: string) {
    if (!isValidObjectId(id_client)) {
      throw new BadRequestException('Invalid client ID');
    }
    const reservations = await this.reservationsService.getCompletedReservationsByClient(id_client);
    return {
      success: true,
      data: reservations,
    };
  }

  // @Get('client/:id_client/non-completed')
  // async getNonCompletedReservationsByClient(@Param('id_client') id_client: string) {
  //   return this.reservationsService.getNonCompletedReservationsByClient(id_client);
  // }

  @Get('client/:id_client/non-completed-or-canceled')
  async getNonCompletedOrCanceledReservationsByClient(@Param('id_client') id_client: string) {
    if (!isValidObjectId(id_client)) {
      throw new BadRequestException('Invalid client ID');
    }
    const reservations = await this.reservationsService.getNonCompletedOrCanceledReservationsByClient(id_client);
    return {
      success: true,
      data: reservations,
    };
  }

  @Get('client/:id_client/canceled')
  async getCanceledReservationsByClient(@Param('id_client') id_client: string) {
    if (!isValidObjectId(id_client)) {
      throw new BadRequestException('Invalid client ID');
    }
    const reservations = await this.reservationsService.getCanceledReservationsByClient(id_client);
    return {
      success: true,
      data: reservations,
    };
  }

  @Get('prestataire')
  async getReservationsByPrestataire(@Query('id_prestataire') id_prestataire: string) {
    try {
      console.log(`[CONTROLLER] Searching for prestataire: ${id_prestataire}`);
      const reservations = await this.reservationsService.getReservationsByPrestataire(id_prestataire);
      return {
        success: true,
        data: reservations,
      };
    } catch (error) {
      console.error(`[CONTROLLER ERROR]`, error);
      if (error instanceof NotFoundException) {
        return {
          success: true,
          data: [],
          message: error.message,
        };
      }
      throw error;
    }
  }


  //  @Get(':id')
  // async getReservationById(@Param('id') id: string) {
  //   const reservation = await this.reservationsService.getReservationById(id);
  //   return {
  //     success: true,
  //     data: reservation,
  //   };
  // }
  @Get(':id')
async getReservationById(@Param('id') id: string) {
  return this.reservationsService.getReservationById(id);
}

  // @Delete(':id')
  // async deleteReservation(@Param('id') id: string) {
  //   await this.reservationsService.deleteReservation(id);
  //   return { success: true, message: 'Réservation supprimée avec succès' };
  // }
@Delete(':id')
  async deleteReservation(@Param('id') id: string) {
    this.logger.log(`[DEBUG] Received DELETE request for reservation ${id}`);
    if (!isValidObjectId(id)) {
      this.logger.error(`[DEBUG] Invalid reservation ID: ${id}`);
      throw new BadRequestException('Invalid reservation ID');
    }
    try {
      const result = await this.reservationsService.deleteReservation(id);
      return result;
    } catch (error) {
      this.logger.error(`[DEBUG] Error deleting reservation ${id}: ${error.message}`);
      throw error instanceof HttpException ? error : new HttpException(error.message, 500);
    }
  }

  @Put(':id/cancel')
  async cancelReservation(@Param('id') id: string) {
    try {
      const result = await this.reservationsService.cancelReservation(id);
      return {
        success: true,
        message: result.matchingReservation
          ? 'Reservation canceled with waiting list promotion'
          : 'Reservation canceled',
        data: {
          canceled: result.canceledReservation,
          ...(result.matchingReservation && { promoted: result.matchingReservation })
        }
      };
    } catch (error) {
      throw new HttpException({ success: false, message: error.message }, error.status || 500);
    }
  }

  // @Put(':id')
  // async updateReservation(@Param('id') id: string, @Body() updateData: Partial<Reservation>) {
  //   const reservation = await this.reservationsService.updateReservation(id, updateData);
  //   return {
  //     success: true,
  //     data: reservation,
  //   };
  // }

  // @Delete(':id')
  // async deleteReservation(@Param('id') id: string) {
  //   await this.reservationsService.deleteReservation(id);
  //   return {
  //     success: true,
  //     message: 'Réservation supprimée avec succès',
  //   };
  // }

  // @Put(':id/cancel')
  // async cancelReservation(@Param('id') id: string) {
  //   try {
  //     const result = await this.reservationsService.cancelReservation(id);
  //     return {
  //       success: true,
  //       message: result.matchingReservation
  //         ? 'Reservation canceled with waiting list promotion'
  //         : 'Reservation canceled',
  //       data: {
  //         canceled: result.canceledReservation,
  //         ...(result.matchingReservation && { promoted: result.matchingReservation }),
  //       },
  //     };
  //   } catch (error) {
  //     throw new HttpException(
  //       {
  //         success: false,
  //         message: error.message,
  //       },
  //       error.status || 500,
  //     );
  //   }
  // }

  @Get('points/:userId')
  async getPointsForUser(@Param('userId') userId: string) {
    try {
      const points = await this.reservationsService.getPointsForUser(userId);
      return { success: true, data: points };
    } catch (error) {
      throw new HttpException({ success: false, message: error.message }, error.status || 500);
    }
  }

  @Get('verify/:id')
  async verifyReservation(@Param('id') id: string) {
    const reservation = await this.reservationsService.verifyAndCompleteReservation(id);
    return { success: true, data: reservation, message: 'Réservation marquée comme complétée' };
  }

  @Post(':id/send-location')
  async sendLocationCard(@Param('id') id: string, @Body() body: { senderId: string; lat: number; lng: number }) {
    console.log(`Received request to send location card for reservation ${id}`, body);
    try {
      const { senderId, lat, lng } = body;
      const result = await this.reservationsService.sendLocationCard(id, senderId, lat, lng);
      console.log('Location card sent successfully:', result);
      return { success: true, data: result, message: 'Location card sent successfully' };
    } catch (error) {
      console.error('Error sending location card:', error);
      throw new HttpException({ success: false, message: error.message }, error.status || 500);
    }
  }



  @Get('prestataire/:prestataireId')
  async getReservationsByPrestataireAndStatus(@Param('prestataireId') prestataireId: string, @Query('status') status?: string) {
    try {
      console.log(`[CONTROLLER] Fetching reservations for prestataire: ${prestataireId}, status: ${status}`);
      const reservations = await this.reservationsService.getReservationsByPrestataireAndStatus(prestataireId, status);
      return {
        success: true,
        data: reservations,
        count: reservations.length,
        message: reservations.length ? 'Reservations retrieved successfully' : 'No reservations found',
      };
    } catch (error) {
      console.error(`[CONTROLLER ERROR]`, error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        return { success: true, data: [], message: error.message };
      }
      throw new HttpException({ success: false, message: error.message }, error.status || 500);
    }
  }

  // @Put(':id')
  // async updateReservation(@Param('id') id: string, @Body() updateData: Partial<Reservation>) {
  //   try {
  //     const reservation = await this.reservationsService.updateReservation(id, updateData);
  //     return { success: true, data: reservation };
  //   } catch (error) {
  //     console.error(`Error updating reservation ${id}:`, error);
  //     throw new HttpException(
  //       { success: false, message: error.message || 'Failed to update reservation', details: error.stack },
  //       error.status || HttpStatus.INTERNAL_SERVER_ERROR
  //     );
  //   }
  // }

@Put(':id')
  async updateReservation(@Param('id') id: string, @Body() updateData: Partial<Reservation>) {
    this.logger.log(`[DEBUG] Received PUT request to update reservation ${id} with data: ${JSON.stringify(updateData)}`);
    try {
      const reservation = await this.reservationsService.updateReservation(id, updateData);
      return { success: true, data: reservation };
    } catch (error) {
      this.logger.error(`[DEBUG] Error updating reservation ${id}: ${error.message}, Stack: ${error.stack}`);
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to update reservation',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }


@Post('notify')
  @HttpCode(HttpStatus.OK)
  async sendNotification(@Body() body: { email: string; subject: string; message: string }) {
    this.logger.log(`[DEBUG] Notify request received: ${JSON.stringify(body, null, 2)}`);
    try {
      if (!body.email || !body.subject || !body.message) {
        this.logger.error(`[DEBUG] Invalid notify data: ${JSON.stringify(body)}`);
        throw new HttpException('Missing email, subject, or message', HttpStatus.BAD_REQUEST);
      }
      await this.reservationsService.sendEmail(body.email, body.subject, body.message);
      this.logger.log(`[DEBUG] Notify email process completed for ${body.email}`);
      return { success: true, message: 'Email notification sent successfully' };
    } catch (error) {
      this.logger.error(`[DEBUG] Notify error for ${body.email}: ${error.message}, Stack: ${error.stack}`);
      const errorMessage = error.message || 'Failed to send email notification';
      const statusCode = error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(
        { success: false, message: errorMessage, details: error.stack },
        statusCode
      );
    }
  }

//lele dashboard
@Get('detailed-statistics')
  async getDetailedStatistics() {
    const stats = await this.reservationsService.getDetailedStatistics();
    return { success: true, data: stats };
  }
  // @Get('verify/:id')
  
  // async verifyReservation(@Param('id') id: string) {
  //   const reservation = await this.reservationsService.verifyAndCompleteReservation(id);
  //   return {
  //     success: true,
  //     data: reservation,
  //     message: 'Réservation marquée comme complétée',
  //   };
  // }
 


  @Post(':id/rate')
  async ratePrestataire(
    @Param('id') reservationId: string,
    @Body() body: { prestataireId: string; rating: number },
  ) {
    await this.reservationsService.submitRating(
      reservationId,
      body.prestataireId,
      body.rating,
    );
    return {
      success: true,
      message: 'Évaluation enregistrée avec succès',
    };
  }
 
}