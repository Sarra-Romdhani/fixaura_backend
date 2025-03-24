import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Reservation } from './reservation.schema';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectModel('Reservation') private reservationModel: Model<Reservation>,
  ) {}

  // Créer une nouvelle réservation
  async createReservation(reservationData: Partial<Reservation>): Promise<Reservation> {
    const newReservation = new this.reservationModel(reservationData);
    return newReservation.save();
  }

  // Récupérer toutes les réservations
  async getAllReservations(): Promise<Reservation[]> {
    return this.reservationModel.find().exec();
  }

  // Récupérer une réservation par ID
  async getReservationById(id: string): Promise<Reservation> {
    const reservation = await this.reservationModel.findById(id).exec();
    if (!reservation) {
      throw new NotFoundException(`Réservation avec l'ID ${id} non trouvée`);
    }
    return reservation;
  }

  // Récupérer les réservations par client
  async getReservationsByClient(id_client: string): Promise<Reservation[]> {
    const reservations = await this.reservationModel.find({ id_client }).exec();
    if (!reservations.length) {
      throw new NotFoundException(`Aucune réservation trouvée pour le client ${id_client}`);
    }
    return reservations;
  }

  // Récupérer les réservations par prestataire
  async getReservationsByPrestataire(id_prestataire: string): Promise<Reservation[]> {
    const reservations = await this.reservationModel.find({ id_prestataire }).exec();
    if (!reservations.length) {
      throw new NotFoundException(`Aucune réservation trouvée pour le prestataire ${id_prestataire}`);
    }
    return reservations;
  }

  // Mettre à jour une réservation
  async updateReservation(id: string, updateData: Partial<Reservation>): Promise<Reservation> {
    const updatedReservation = await this.reservationModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
    if (!updatedReservation) {
      throw new NotFoundException(`Réservation avec l'ID ${id} non trouvée`);
    }
    return updatedReservation;
  }

  // Supprimer une réservation
  async deleteReservation(id: string): Promise<void> {
    const result = await this.reservationModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Réservation avec l'ID ${id} non trouvée`);
    }
  }
}