import { Controller, Get, Post, Put, Delete, Query, Body, Param, NotFoundException, BadRequestException, HttpException } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { Reservation } from './reservation.schema';
import { isValidObjectId } from 'mongoose';
import { MessagesService } from 'src/messages/messages.service';

@Controller('reservations')
export class ReservationsController {
  constructor(
    private readonly reservationsService: ReservationsService,
    private readonly messagesService: MessagesService,
  ) {}

  @Post()
  async createReservation(@Body() reservationData: Partial<Reservation>) {
    const reservation = await this.reservationsService.createReservation(reservationData);
    return {
      success: true,
      data: reservation,
    };
  }

  @Get()
  async getAllReservations() {
    const reservations = await this.reservationsService.getAllReservations();
    return {
      success: true,
      data: reservations,
    };
  }

  @Get(':id')
  async getReservationById(@Param('id') id: string) {
    const reservation = await this.reservationsService.getReservationById(id);
    return {
      success: true,
      data: reservation,
    };
  }

  @Get('client/:id_client')
  async getReservationsByClient(@Param('id_client') id_client: string) {
    const reservations = await this.reservationsService.getReservationsByClient(id_client);
    return {
      success: true,
      data: reservations,
    };
  }

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

  @Put(':id')
  async updateReservation(@Param('id') id: string, @Body() updateData: Partial<Reservation>) {
    const reservation = await this.reservationsService.updateReservation(id, updateData);
    return {
      success: true,
      data: reservation,
    };
  }

  @Delete(':id')
  async deleteReservation(@Param('id') id: string) {
    await this.reservationsService.deleteReservation(id);
    return {
      success: true,
      message: 'Réservation supprimée avec succès',
    };
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
          ...(result.matchingReservation && { promoted: result.matchingReservation }),
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status || 500,
      );
    }
  }

  @Get('points/:userId')
  async getPointsForUser(@Param('userId') userId: string) {
    try {
      const points = await this.reservationsService.getPointsForUser(userId);
      return {
        success: true,
        data: points,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status || 500,
      );
    }
  }

  @Get('verify/:id')
  async verifyReservation(@Param('id') id: string) {
    const reservation = await this.reservationsService.verifyAndCompleteReservation(id);
    return {
      success: true,
      data: reservation,
      message: 'Réservation marquée comme complétée',
    };
  }

  @Post(':id/send-location')
  async sendLocationCard(
    @Param('id') id: string,
    @Body() body: { senderId: string; lat: number; lng: number },
  ) {
    console.log(`Received request to send location card for reservation ${id}`, body);
    try {
      const { senderId, lat, lng } = body;
      const result = await this.reservationsService.sendLocationCard(id, senderId, lat, lng);
      console.log('Location card sent successfully:', result);
      return {
        success: true,
        data: result,
        message: 'Location card sent successfully',
      };
    } catch (error) {
      console.error('Error sending location card:', error);
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status || 500,
      );
    }
  }

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