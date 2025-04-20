import { Controller, Get, Post, Put, Delete, Query, Body, Param } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { Reservation } from './reservation.schema';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

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

  // Récupérer une réservation par ID
  @Get(':id')
  async getReservationById(@Param('id') id: string) {
    const reservation = await this.reservationsService.getReservationById(id);
    return {
      success: true,
      data: reservation,
    };
  }

  // Récupérer les réservations par client
  @Get('client/:id_client')
  async getReservationsByClient(@Param('id_client') id_client: string) {
    const reservations = await this.reservationsService.getReservationsByClient(id_client);
    return {
      success: true,
      data: reservations,
    };
  }

  // Récupérer les réservations terminées par client (status = "completed")
  @Get('client/:id/completed')
  async getCompletedReservationsByClient(@Param('id') id_client: string): Promise<Reservation[]> {
    return this.reservationsService.getCompletedReservationsByClient(id_client);
  }

  // Récupérer les réservations non terminées par client (status != "completed")
  @Get('client/:id/non-completed')
  async getNonCompletedReservationsByClient(@Param('id') id_client: string): Promise<Reservation[]> {
    return this.reservationsService.getNonCompletedReservationsByClient(id_client);
  }

  // Récupérer les réservations par prestataire
  @Get('prestataire/:id_prestataire')
  async getReservationsByPrestataire(@Param('id_prestataire') id_prestataire: string) {
    const reservations = await this.reservationsService.getReservationsByPrestataire(id_prestataire);
    return {
      success: true,
      data: reservations,
    };
  }

  // Mettre à jour une réservation
  @Put(':id')
  async updateReservation(@Param('id') id: string, @Body() updateData: Partial<Reservation>) {
    const reservation = await this.reservationsService.updateReservation(id, updateData);
    return {
      success: true,
      data: reservation,
    };
  }

  // Supprimer une réservation
  @Delete(':id')
  async deleteReservation(@Param('id') id: string) {
    await this.reservationsService.deleteReservation(id);
    return {
      success: true,
      message: 'Réservation supprimée avec succès',
    };
  }
}