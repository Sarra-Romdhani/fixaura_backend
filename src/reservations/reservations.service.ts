import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import { Reservation } from './reservation.schema';
import { Prestataire } from 'src/prestataires/prestataire.schema';
import { Client } from 'src/clients/client.schema';
import { MessagesService } from 'src/messages/messages.service';
import * as QRCode from 'qrcode';
import { Points } from 'src/points/Point.schema';
import { LocationService } from 'src/locations/locations.service';
import { Server } from 'socket.io';

@Injectable()
export class ReservationsService {
  private io: Server;

  constructor(
    @InjectModel('Reservation') private reservationModel: Model<Reservation>,
    private messagesService: MessagesService,
    @InjectModel('Client') private clientModel: Model<Client>,
    @InjectModel('Prestataire') private prestataireModel: Model<Prestataire>,
    @InjectModel('Points') private pointsModel: Model<Points>,
    private locationService: LocationService,
  ) {}

  setSocketIo(io: Server) {
    this.io = io;
  }

  async createReservation(reservationData: Partial<Reservation>): Promise<Reservation> {
    if (!reservationData.id_client || !isValidObjectId(reservationData.id_client)) {
      throw new BadRequestException('ID client invalide');
    }
    if (!reservationData.id_prestataire || !isValidObjectId(reservationData.id_prestataire)) {
      throw new BadRequestException('ID prestataire invalide');
    }

    if (reservationData.id_client === reservationData.id_prestataire) {
      throw new BadRequestException('Un utilisateur ne peut pas réserver ses propres services');
    }

    if (!reservationData.date) {
      throw new BadRequestException('Date de réservation requise');
    }
    const reservationDate = new Date(reservationData.date);
    if (isNaN(reservationDate.getTime())) {
      throw new BadRequestException('Date invalide');
    }

    const oneHourBefore = new Date(reservationDate.getTime() - 60 * 60 * 1000);
    const twoHoursAfter = new Date(reservationDate.getTime() + 2 * 60 * 60 * 1000);

    const conflictingReservations = await this.reservationModel.find({
      id_prestataire: reservationData.id_prestataire,
      status: 'confirmed',
      date: {
        $gte: oneHourBefore,
        $lte: twoHoursAfter,
      },
    }).exec();

    const status = conflictingReservations.length > 0 ? 'waiting' : 'pending';

    try {
      const newReservation = new this.reservationModel({
        ...reservationData,
        status,
      });

      const result = await this.reservationModel
        .findById(newReservation._id)
        .populate('id_client', 'name email phoneNumber');
      return await newReservation.save();
    } catch (error) {
      console.error('Error saving reservation:', error);
      throw new InternalServerErrorException('Erreur lors de la création de la réservation');
    }
  }

  async getAllReservations(): Promise<Reservation[]> {
    return this.reservationModel.find().exec();
  }

  async getReservationById(id: string): Promise<Reservation> {
    const reservation = await this.reservationModel.findById(id).exec();
    if (!reservation) {
      throw new NotFoundException(`Réservation avec l'ID ${id} non trouvée`);
    }
    return reservation;
  }

  async getReservationsByClient(id_client: string): Promise<Reservation[]> {
    const reservations = await this.reservationModel.find({ id_client }).exec();
    return reservations;
  }

  async getCompletedReservationsByClient(id_client: string): Promise<Reservation[]> {
    const reservations = await this.reservationModel
      .find({ id_client, status: 'completed' })
      .exec();
    return reservations;
  }

  // async getNonCompletedReservationsByClient(id_client: string): Promise<Reservation[]> {
  //   const reservations = await this.reservationModel
  //     .find({ id_client, status: { $ne: 'completed' } })
  //     .exec();
  //   return reservations;
  // }

  // New method for non-completed and non-canceled reservations
  async getNonCompletedOrCanceledReservationsByClient(id_client: string): Promise<Reservation[]> {
    if (!isValidObjectId(id_client)) {
      throw new BadRequestException('Invalid client ID');
    }
    const reservations = await this.reservationModel
      .find({
        id_client,
        status: { $nin: ['completed', 'canceled'] },
      })
      .exec();
    return reservations;
  }

  // New method for canceled reservations
  async getCanceledReservationsByClient(id_client: string): Promise<Reservation[]> {
    if (!isValidObjectId(id_client)) {
      throw new BadRequestException('Invalid client ID');
    }
    const reservations = await this.reservationModel
      .find({ id_client, status: 'canceled' })
      .exec();
    return reservations;
  }

  async getReservationsByPrestataire(id_prestataire: string): Promise<Reservation[]> {
    const reservations = await this.reservationModel.find({ id_prestataire }).exec();
    if (!reservations.length) {
      throw new NotFoundException(`Aucune réservation trouvée pour le prestataire ${id_prestataire}`);
    }
    return reservations;
  }

  async deleteReservation(id: string): Promise<void> {
    const reservation = await this.reservationModel.findById(id).exec();
    if (!reservation) {
      throw new NotFoundException(`Réservation avec l'ID ${id} non trouvée`);
    }

    const wasConfirmed = reservation.status === 'confirmed';
    const prestataireId = reservation.id_prestataire;
    const reservationDate = reservation.date;

    const result = await this.reservationModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Réservation avec l'ID ${id} non trouvée`);
    }

    if (wasConfirmed) {
      await this.promoteFirstWaitingReservation(prestataireId, reservationDate);
    }
  }

  async promoteFirstWaitingReservation(prestataireId: string, date: Date): Promise<void> {
    const twoHoursBefore = new Date(date.getTime() - 2 * 60 * 60 * 1000);
    const oneHourAfter = new Date(date.getTime() + 60 * 60 * 1000);

    const waitingReservations = await this.reservationModel
      .find({
        id_prestataire: prestataireId,
        status: 'waiting',
        date: {
          $gte: twoHoursBefore,
          $lte: oneHourAfter,
        },
      })
      .sort({ createdAt: 1 })
      .exec();

    if (waitingReservations.length > 0) {
      const firstInLine = waitingReservations[0];
      await this.reservationModel
        .findByIdAndUpdate(firstInLine._id, { status: 'pending' }, { new: true })
        .exec();
      console.log(`Promoted reservation ${firstInLine._id} to pending`);
    } else {
      console.log(`No waiting reservations found for ${prestataireId} between ${twoHoursBefore} and ${oneHourAfter}`);
    }
  }

  async findByPrestataire(prestataireId: string, status?: string) {
    const query: any = { id_prestataire: prestataireId };
    if (status) {
      query.status = status;
    }
    return this.reservationModel.find(query).exec();
  }

  async cancelReservation(id: string): Promise<{
    canceledReservation: Reservation;
    matchingReservation?: Reservation;
  }> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid reservation ID format');
    }

    const reservationToCancel = await this.reservationModel.findById(id).exec();
    if (!reservationToCancel) {
      throw new NotFoundException(`Reservation with ID ${id} not found`);
    }

    if (reservationToCancel.status !== 'confirmed') {
      throw new BadRequestException('Only confirmed reservations can be canceled');
    }

    const canceledDateTime = reservationToCancel.date;
    const startTime = new Date(canceledDateTime.getTime() - 60 * 60 * 1000);
    const endTime = new Date(canceledDateTime.getTime() + 2 * 60 * 60 * 1000);

    const waitingReservations = await this.reservationModel
      .find({
        id_prestataire: reservationToCancel.id_prestataire,
        status: 'waiting',
        date: {
          $gte: startTime,
          $lte: endTime,
          $ne: canceledDateTime,
        },
      })
      .sort({ createdAt: 1 })
      .lean<Reservation[]>()
      .exec();

    let promotedReservation: Reservation | null = null;
    if (waitingReservations.length > 0) {
      try {
        promotedReservation = await this.reservationModel.findByIdAndUpdate(
          waitingReservations[0]._id,
          { $set: { status: 'pending' } },
          { new: true, runValidators: true },
        ).exec();

        if (!promotedReservation) {
          throw new NotFoundException('Waiting reservation not found after promotion attempt');
        }
      } catch (promotionError) {
        throw new InternalServerErrorException(
          `Failed to promote waiting reservation: ${promotionError.message}`,
        );
      }
    }

    let canceledReservation: Reservation | null;
    try {
      canceledReservation = await this.reservationModel.findByIdAndUpdate(
        id,
        { $set: { status: 'canceled' } },
        { new: true, runValidators: true },
      ).exec();
    } catch (cancelError) {
      if (promotedReservation) {
        await this.reservationModel.findByIdAndUpdate(
          promotedReservation._id,
          { $set: { status: 'waiting' } },
        ).exec();
      }
      throw new InternalServerErrorException(
        `Cancellation failed: ${cancelError.message}`,
      );
    }

    if (!canceledReservation) {
      throw new NotFoundException('Reservation not found after cancellation attempt');
    }

    return {
      canceledReservation,
      ...(promotedReservation && { matchingReservation: promotedReservation }),
    };
  }

  async generateQRCode(reservation: Reservation): Promise<string> {
    const reservationDetails = {
      id: reservation._id,
      prestataireId: reservation.id_prestataire,
      clientId: reservation.id_client,
      date: reservation.date.toISOString(),
      location: reservation.location,
      service: reservation.service,
      price: reservation.price,
      status: reservation.status,
      verificationUrl: `http://f35.local:3000/reservations/verify/${reservation._id}`,
    };
    const qrData = JSON.stringify(reservationDetails);
    return await QRCode.toDataURL(qrData);
  }

  async updateReservation(id: string, updateData: Partial<Reservation>): Promise<Reservation> {
    if (updateData.status === 'confirmed') {
      const reservation = await this.reservationModel.findById(id).exec();
      if (!reservation) {
        throw new NotFoundException(`Réservation avec l'ID ${id} non trouvée`);
      }
      const qrCodeDataUrl = await this.generateQRCode(reservation);
      (updateData as any).qrCode = qrCodeDataUrl;
      await this.messagesService.saveMessage(
        reservation.id_prestataire,
        reservation.id_client,
        `Votre réservation a été confirmée. Voici votre QR code avec les détails: ${qrCodeDataUrl}`,
      );
    }
    const updatedReservation = await this.reservationModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
    if (!updatedReservation) {
      throw new NotFoundException(`Réservation avec l'ID ${id} non trouvée`);
    }
    return updatedReservation;
  }

  async verifyAndCompleteReservation(id: string): Promise<Reservation> {
    console.log(`Verifying reservation ID: ${id}`);
    if (!isValidObjectId(id)) {
      console.error(`Invalid reservation ID: ${id}`);
      throw new BadRequestException('Invalid reservation ID');
    }

    const reservation = await this.reservationModel.findById(id).exec();
    if (!reservation) {
      console.error(`Reservation not found: ${id}`);
      throw new NotFoundException(`Réservation avec l'ID ${id} non trouvée`);
    }
    console.log(`Reservation status: ${reservation.status}, isRated: ${reservation.isRated}`);
    if (reservation.status !== 'confirmed') {
      console.error(`Invalid status for reservation ${id}: ${reservation.status}`);
      throw new BadRequestException('Réservation doit être confirmée pour être complétée');
    }
    if (reservation.isRated) {
      console.error(`Reservation already rated: ${id}`);
      throw new BadRequestException('Cette réservation a déjà été évaluée');
    }

    const prestataire = await this.prestataireModel.findById(reservation.id_prestataire).exec();
    if (!prestataire) {
      console.error(`Prestataire not found for reservation ${id}`);
      throw new NotFoundException('Prestataire non trouvé');
    }

    let counterpart;
    counterpart = await this.clientModel.findById(reservation.id_client).exec();
    if (!counterpart) {
      counterpart = await this.prestataireModel.findById(reservation.id_client).exec();
      if (!counterpart) {
        console.error(`Client/Prestataire not found for reservation ${id}`);
        throw new NotFoundException('Utilisateur (Client ou Prestataire) non trouvé');
      }
    }

    let pointsRecord = await this.pointsModel
      .findOne({ userId: reservation.id_client, prestataireId: reservation.id_prestataire })
      .exec();

    if (!pointsRecord) {
      pointsRecord = new this.pointsModel({
        userId: reservation.id_client,
        prestataireId: reservation.id_prestataire,
        points: 0,
      });
    }

    let updatedPrice = reservation.price;
    let discountApplied = false;

    if (pointsRecord.points > 0 && pointsRecord.points % 5 === 0 && updatedPrice) {
      updatedPrice = updatedPrice * 0.85;
      discountApplied = true;
    }

    const updatedReservation = await this.reservationModel
      .findByIdAndUpdate(
        id,
        {
          status: 'completed',
          price: updatedPrice,
          discountApplied,
        },
        { new: true },
      )
      .exec();

    if (!updatedReservation) {
      console.error(`Failed to update reservation ${id}`);
      throw new InternalServerErrorException(`Erreur lors de la mise à jour de la réservation avec l'ID ${id}`);
    }

    await this.pointsModel
      .updateOne(
        { userId: reservation.id_client, prestataireId: reservation.id_prestataire },
        { $inc: { points: 1 } },
        { upsert: true },
      )
      .exec();

    if (discountApplied) {
      try {
        await this.messagesService.saveMessage(
          reservation.id_prestataire,
          reservation.id_client,
          `Félicitations ! Une réduction de 15% a été appliquée à votre réservation avec ${prestataire.name} grâce à vos ${pointsRecord.points} points. Nouveau prix: ${updatedPrice} MAD.`,
        );
      } catch (e) {
        console.error(`Failed to send discount message for reservation ${id}: ${e}`);
      }
    }

    try {
      const ratingMessage = await this.messagesService.saveMessage(
        reservation.id_prestataire,
        reservation.id_client,
        `Votre réservation avec ${prestataire.name} est terminée. Veuillez évaluer votre expérience (1 à 5 étoiles).`,
        false,
        undefined,
        reservation.id,
        true,
      );
      console.log(`Rating prompt message sent: ID=${ratingMessage._id}, to=${reservation.id_client}, reservation=${id}`);

      this.io.to(reservation.id_client.toString()).emit('trigger-rating', {
        reservationId: id,
        prestataireId: reservation.id_prestataire.toString(),
        clientId: reservation.id_client.toString(),
      });
      console.log(`Emitted trigger-rating to client ${reservation.id_client}`);
    } catch (e) {
      console.error(`Failed to send rating prompt for reservation ${id}: ${e}`);
    }

    return updatedReservation;
  }

  async getPointsForUser(userId: string): Promise<Points[]> {
    return this.pointsModel.find({ userId }).populate('prestataireId').exec();
  }

  async sendLocationCard(
    reservationId: string,
    senderId: string,
    lat: number,
    lng: number,
  ): Promise<{ message: any; location: { lat: number; lng: number } }> {
    if (!isValidObjectId(reservationId) || !isValidObjectId(senderId)) {
      throw new BadRequestException('Invalid reservationId or senderId');
    }
    if (isNaN(lat) || isNaN(lng)) {
      throw new BadRequestException('Invalid coordinates');
    }

    const reservation = await this.reservationModel.findById(reservationId).exec();
    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${reservationId} not found`);
    }
    if (reservation.status !== 'confirmed') {
      throw new BadRequestException('Reservation must be confirmed to send location');
    }
    if (reservation.id_prestataire.toString() !== senderId) {
      throw new BadRequestException('Only the prestataire can send location');
    }

    try {
      const savedLocation = await this.locationService.updateLocation(senderId, reservationId, { lat, lng });

      const message = await this.messagesService.saveMessage(
        senderId,
        reservation.id_client.toString(),
        'Prestataire location shared',
        true,
        { lat, lng },
        reservationId,
      );

      if (this.io) {
        this.io.to(reservation.id_client.toString()).emit('updateLocation', {
          prestataireId: senderId,
          reservationId,
          coordinates: { lat, lng },
          timestamp: savedLocation.updatedAt,
        });
        console.log(`Location update emitted for client ${reservation.id_client} on reservation ${reservationId}`);
      }

      return {
        message,
        location: { lat, lng },
      };
    } catch (error) {
      console.error(`Error in sendLocationCard: ${error.message}`);
      throw new InternalServerErrorException(`Failed to send location card: ${error.message}`);
    }
  }

  async submitRating(reservationId: string, prestataireId: string, rating: number): Promise<void> {
    if (!isValidObjectId(reservationId) || !isValidObjectId(prestataireId)) {
      throw new BadRequestException('Invalid reservation or prestataire ID');
    }
    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const reservation = await this.reservationModel.findById(reservationId);
    if (!reservation) {
      throw new NotFoundException('Réservation non trouvée');
    }
    if (reservation.status !== 'completed') {
      throw new BadRequestException('Seules les réservations terminées peuvent être évaluées');
    }
    if (reservation.isRated) {
      throw new BadRequestException('Cette réservation a déjà été évaluée');
    }

    const prestataire = await this.prestataireModel.findById(prestataireId);
    if (!prestataire) {
      throw new NotFoundException('Prestataire non trouvé');
    }

    const newRatingCount = prestataire.ratingCount + 1;
    const newRating = 
      (prestataire.rating * prestataire.ratingCount + rating) / newRatingCount;

    await this.prestataireModel.findByIdAndUpdate(
      prestataireId,
      {
        rating: newRating,
        ratingCount: newRatingCount,
      },
      { new: true }
    ).exec();

    await this.reservationModel.findByIdAndUpdate(
      reservationId,
      { isRated: true },
      { new: true }
    ).exec();
  }
}