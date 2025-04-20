import { Controller, Get, Post, Put, Delete, Query, Body, Param, NotFoundException, BadRequestException, HttpException } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { Reservation } from './reservation.schema';
import { isValidObjectId } from 'mongoose';
import { MessagesService } from 'src/messages/messages.service';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService,
    private readonly messagesService: MessagesService,
  ) {}

  // Créer une nouvelle réservation
  @Post()
  async createReservation(@Body() reservationData: Partial<Reservation>) {
    const reservation = await this.reservationsService.createReservation(reservationData);
    return {
      success: true,
      data: reservation,
    };
  }

  // Récupérer toutes les réservations
  @Get()
  async getAllReservations() {
    const reservations = await this.reservationsService.getAllReservations();
    return {
      success: true,
      data: reservations,
    };
  }



  // Récupérer les réservations par client
  @Get('client')
  async getReservationsByClient(@Query('id_client') id_client: string) {
    const reservations = await this.reservationsService.getReservationsByClient(id_client);
    return {
      success: true,
      data: reservations,
    };
  }

  // Récupérer les réservations par prestataire
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
          message: error.message
        };
      }
      throw error;
    }
  }
  @Get('prestataire/:id')
async getByPrestataire(
  @Param('id') id: string,
  @Query('status') status?: string
) {
  try {
    const reservations = await this.reservationsService.findByPrestataire(id, status);
    return {
      success: true,
      data: reservations,
      count: reservations.length
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
}
// reservations.controller.ts (NestJS)



    // Récupérer une réservation par ID
    @Get(':id')
    async getReservationById(@Param('id') id: string) {
      const reservation = await this.reservationsService.getReservationById(id);
      return {
        success: true,
        data: reservation,
      };
    }
  // Mettre à jour une réservation
  // @Put(':id')
  // async updateReservation(@Param('id') id: string, @Body() updateData: Partial<Reservation>) {
  //   const reservation = await this.reservationsService.updateReservation(id, updateData);
  //   return {
  //     success: true,
  //     data: reservation,
  //   };
  // }

 // Supprimer une réservation
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
        ...(result.matchingReservation && { promoted: result.matchingReservation })
      }
    };
  } catch (error) {
    throw new HttpException({
      success: false,
      message: error.message
    }, error.status || 500);
  }
}



















//lel points
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
    message: 'Réservation marquée comme complétée'
  };
}
@Put(':id')
async updateReservation(@Param('id') id: string, @Body() updateData: Partial<Reservation>) {
  const reservation = await this.reservationsService.updateReservation(id, updateData);
  return {
    success: true,
    data: reservation,
  };
}


























@Post(':id/send-location')
async sendLocationCard(
  @Param('id') id: string,
  @Body() body: { senderId: string; lat: number; lng: number }
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
    @Body() body: { prestataireId: string; rating: number }
  ) {
    await this.reservationsService.submitRating(
      reservationId,
      body.prestataireId,
      body.rating
    );
    return {
      success: true,
      message: 'Évaluation enregistrée avec succès'
    };
  }
}