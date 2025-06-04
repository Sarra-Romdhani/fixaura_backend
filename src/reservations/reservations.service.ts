// import { BadRequestException, HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { isValidObjectId, Model, Types } from 'mongoose';
// import { Reservation } from './reservation.schema';
// import { Prestataire } from 'src/prestataires/prestataire.schema';
// import { Client } from 'src/clients/client.schema';
// import { MessagesService } from 'src/messages/messages.service';
// import * as QRCode from 'qrcode';
// import { Points } from 'src/points/Point.schema';
// import { LocationService } from 'src/locations/locations.service';
// import { Server } from 'socket.io';
// import { FacturesService } from 'src/factures/factures.service';
// import { Facture } from 'src/factures/facture.schema';
// import * as nodemailer from 'nodemailer';
// import { ConfigService } from '@nestjs/config';
// import { Cron, CronExpression } from '@nestjs/schedule';

// @Injectable()
// export class ReservationsService {
//   private io: Server;
//   private readonly logger = new Logger(ReservationsService.name);
// private transporter: nodemailer.Transporter | null = null;
// constructor(
//   @InjectModel('Reservation') private reservationModel: Model<Reservation>,
//   private messagesService: MessagesService,
//   @InjectModel('Client') private clientModel: Model<Client>,
//   @InjectModel('Prestataire') private prestataireModel: Model<Prestataire>,
//   @InjectModel('Points') private pointsModel: Model<Points>,
//   private locationService: LocationService,
//   private facturesService: FacturesService,
//   private configService: ConfigService,
// ) {
//  this.initializeTransporter()
//     .then(() => this.logger.log('[DEBUG] Email transporter initialized successfully'))
//     .catch((error) => {
//       this.logger.error(`[ERROR] Failed to initialize transporter: ${error.message}`);
//     });



// }

// private async initializeTransporter(): Promise<void> {
//   const emailUser = this.configService.get<string>('EMAIL_USER');
//   const emailPass = this.configService.get<string>('EMAIL_PASS');
//   const emailHost = this.configService.get<string>('EMAIL_HOST');
//   const emailPort = this.configService.get<number>('EMAIL_PORT');

//   this.logger.debug(`[DEBUG] Initializing transporter with: user=${emailUser}, host=${emailHost}, port=${emailPort}`);

//   if (!emailUser || !emailPass || !emailHost || !emailPort) {
//     throw new Error('Missing email configuration (EMAIL_USER, EMAIL_PASS, EMAIL_HOST, EMAIL_PORT)');
//   }

//   this.transporter = nodemailer.createTransport({
//     host: emailHost,
//     port: emailPort,
//     secure: emailPort === 465,
//     auth: {
//       user: emailUser,
//       pass: emailPass,
//     },
//   });

//   try {
//     await this.transporter.verify();
//     this.logger.log('[DEBUG] Email transporter verified and ready.');
//   } catch (err) {
//     this.transporter = null;
//     throw new Error(`Failed to verify transporter: ${err.message}`);
//   }
// }


//   setSocketIo(io: Server) {
//     this.io = io;
//   }

// async sendEmail(to: string, subject: string, text: string): Promise<boolean> {
//   this.logger.log(`[DEBUG] Sending email to ${to}`);

//   if (!to || !subject || !text) {
//     this.logger.error('[DEBUG] Invalid email parameters');
//     return false;
//   }

//   if (!this.transporter) {
//     try {
//       await this.initializeTransporter();
//       if (!this.transporter) {
//         this.logger.error('[DEBUG] Email transporter not available after reinitialization');
//         return false;
//       }
//     } catch (initError) {
//       this.logger.error(`[DEBUG] Failed to reinitialize transporter: ${initError.message}`);
//       return false;
//     }
//   }

//   const mailOptions = {
//     from: `"Fixaura Platform" <${this.configService.get<string>('EMAIL_USER')}>`,
//     to,
//     subject,
//     text,
//     html: `
//       <div style="font-family: Arial; padding: 20px;">
//         <h2>${subject}</h2>
//         <p>${text}</p>
//         <p>Merci de faire confiance à <strong>Fixaura</strong> !</p>
//         <p style="font-size: 12px;">Si vous n'avez pas initié cette action, contactez-nous à support@fixaura.com.</p>
//       </div>
//     `,
//   };

//   try {
//     const info = await this.transporter.sendMail(mailOptions);
//     this.logger.log(`[DEBUG] Email sent to ${to}: ID ${info.messageId}`);
//     return true;
//   } catch (error) {
//     this.logger.error(`[DEBUG] Failed to send email to ${to}: ${error.message}`);
//     if (error.code === 'ESOCKET' || error.message.includes('ECONNRESET')) {
//       this.logger.warn('[DEBUG] Connection error detected; resetting transporter');
//       this.transporter = null; // Force reinitialization on next attempt
//     }
//     return false;
//   }
// }


// async createReservation(reservationData: Partial<Reservation>): Promise<Reservation> {
//   this.logger.log(`[DEBUG] Creating reservation with data: ${JSON.stringify(reservationData)}`);

//   if (!reservationData.id_client || !isValidObjectId(reservationData.id_client)) {
//     this.logger.error(`[DEBUG] Invalid client ID: ${reservationData.id_client}`);
//     throw new BadRequestException('ID client invalide');
//   }
//   if (!reservationData.id_prestataire || !isValidObjectId(reservationData.id_prestataire)) {
//     this.logger.error(`[DEBUG] Invalid prestataire ID: ${reservationData.id_prestataire}`);
//     throw new BadRequestException('ID prestataire invalide');
//   }
//   if (reservationData.id_client === reservationData.id_prestataire) {
//     this.logger.error('[DEBUG] Self-reservation attempted');
//     throw new BadRequestException('Auto-réservation non autorisée');
//   }
//   if (!reservationData.date) {
//     this.logger.error('[DEBUG] Missing reservation date');
//     throw new BadRequestException('Date de réservation requise');
//   }

//   let date = new Date(reservationData.date);
//   date.setHours(date.getHours() + 1);
//   if (isNaN(date.getTime())) {
//     this.logger.error(`[DEBUG] Invalid date format: ${reservationData.date}`);
//     throw new BadRequestException('Format de date invalide');
//   }

//   const utcDate = new Date(Date.UTC(
//     date.getUTCFullYear(),
//     date.getUTCMonth(),
//     date.getUTCDate(),
//     date.getUTCHours(),
//     date.getUTCMinutes(),
//     date.getUTCSeconds()
//   ));

//   const oneHourBefore = new Date(utcDate.getTime() - 60 * 60 * 1000);
//   const twoHoursAfter = new Date(utcDate.getTime() + 2 * 60 * 60 * 1000);

//   this.logger.log(`[DEBUG] Checking for conflicting reservations for prestataire ${reservationData.id_prestataire}`);
//   const conflictingReservations = await this.reservationModel.find({
//     id_prestataire: reservationData.id_prestataire,
//     status: 'confirmed',
//     date: { $gte: oneHourBefore, $lte: twoHoursAfter }
//   }).exec();

//   try {
//     const newReservation = new this.reservationModel({
//       ...reservationData,
//       date: utcDate,
//       status: conflictingReservations.length > 0 ? 'waiting' : 'pending'
//     });

//     this.logger.log('[DEBUG] Saving new reservation');
//     const savedReservation = await newReservation.save();
//     this.logger.log(`[DEBUG] Reservation saved with ID: ${savedReservation._id}`);

//     // Attempt to populate client details, but don't fail if client is not found
//     let populated: any = savedReservation;
//     try {
//       populated = await this.reservationModel
//         .findById(savedReservation._id)
//         .populate('id_client', 'name email phoneNumber')
//         .lean()
//         .exec();
//       if (!populated) {
//         this.logger.warn(`[DEBUG] Reservation ${savedReservation._id} not found after save`);
//       }
//     } catch (populateError) {
//       this.logger.warn(`[DEBUG] Failed to populate client for reservation ${savedReservation._id}: ${populateError.message}`);
//       // Continue with the saved reservation without population
//       populated = savedReservation.toObject();
//     }

//     // Notify via Socket.IO
//     if (this.io) {
//       this.logger.log(`[DEBUG] Emitting newReservation event for prestataire ${reservationData.id_prestataire}`);
//       this.io.emit('newReservation', {
//         prestataireId: reservationData.id_prestataire,
//         reservationId: savedReservation.id.toString()
//       });
//     }

//     return {
//       ...populated,
//       _id: populated._id.toString(),
//       id_client: populated.id_client?._id?.toString() || reservationData.id_client,
//       id_prestataire: populated.id_prestataire?.toString() || reservationData.id_prestataire,
//       date: new Date(populated.date).toISOString()
//     } as unknown as Reservation;
//   } catch (error) {
//     this.logger.error(`[ERROR] Failed to create reservation: ${error.message}, Stack: ${error.stack}`);
//     throw new InternalServerErrorException(
//       error instanceof Error ? error.message : 'Erreur inconnue'
//     );
//   }
// }
//   async getAllReservations(): Promise<Reservation[]> {
//     return this.reservationModel.find().exec();
//   }

//   async getReservationById(id: string): Promise<Reservation> {
//     const reservation = await this.reservationModel.findById(id).exec();
//     if (!reservation) {
//       throw new NotFoundException(`Réservation avec l'ID ${id} non trouvée`);
//     }
//     return reservation;
//   }

//   async getReservationsByClient(id_client: string): Promise<Reservation[]> {
//     const reservations = await this.reservationModel.find({ id_client }).exec();
//     return reservations;
//   }

//   async getCompletedReservationsByClient(id_client: string): Promise<Reservation[]> {
//     const reservations = await this.reservationModel
//       .find({ id_client, status: 'completed' })
//       .exec();
//     return reservations;
//   }

 

//   // New method for non-completed and non-canceled reservations
//   async getNonCompletedOrCanceledReservationsByClient(id_client: string): Promise<Reservation[]> {
//     if (!isValidObjectId(id_client)) {
//       throw new BadRequestException('Invalid client ID');
//     }
//     const reservations = await this.reservationModel
//       .find({
//         id_client,
//         status: { $nin: ['completed', 'canceled'] },
//       })
//       .exec();
//     return reservations;
//   }

//   // New method for canceled reservations
//   async getCanceledReservationsByClient(id_client: string): Promise<Reservation[]> {
//     if (!isValidObjectId(id_client)) {
//       throw new BadRequestException('Invalid client ID');
//     }
//     const reservations = await this.reservationModel
//       .find({ id_client, status: 'canceled' })
//       .exec();
//     return reservations;
//   }

//   async getReservationsByPrestataire(id_prestataire: string): Promise<Reservation[]> {
//     const reservations = await this.reservationModel.find({ id_prestataire }).exec();
//     if (!reservations.length) {
//       throw new NotFoundException(`Aucune réservation trouvée pour le prestataire ${id_prestataire}`);
//     }
//     return reservations;
//   }

//   // async deleteReservation(id: string): Promise<void> {
//   //   const reservation = await this.reservationModel.findById(id).exec();
//   //   if (!reservation) {
//   //     throw new NotFoundException(`Réservation avec l'ID ${id} non trouvée`);
//   //   }

//   //   const wasConfirmed = reservation.status === 'confirmed';
//   //   const prestataireId = reservation.id_prestataire;
//   //   const reservationDate = reservation.date;

//   //   const result = await this.reservationModel.findByIdAndDelete(id).exec();
//   //   if (!result) {
//   //     throw new NotFoundException(`Réservation avec l'ID ${id} non trouvée`);
//   //   }

//   //   if (wasConfirmed) {
//   //     await this.promoteFirstWaitingReservation(prestataireId, reservationDate);
//   //   }
//   // }

//   async promoteFirstWaitingReservation(prestataireId: string, date: Date): Promise<void> {
//     const twoHoursBefore = new Date(date.getTime() - 2 * 60 * 60 * 1000);
//     const oneHourAfter = new Date(date.getTime() + 60 * 60 * 1000);

//     const waitingReservations = await this.reservationModel
//       .find({
//         id_prestataire: prestataireId,
//         status: 'waiting',
//         date: {
//           $gte: twoHoursBefore,
//           $lte: oneHourAfter,
//         },
//       })
//       .sort({ createdAt: 1 })
//       .exec();

//     if (waitingReservations.length > 0) {
//       const firstInLine = waitingReservations[0];
//       await this.reservationModel
//         .findByIdAndUpdate(firstInLine._id, { status: 'pending' }, { new: true })
//         .exec();
//       console.log(`Promoted reservation ${firstInLine._id} to pending`);
//     } else {
//       console.log(`No waiting reservations found for ${prestataireId} between ${twoHoursBefore} and ${oneHourAfter}`);
//     }
//   }

//   async findByPrestataire(prestataireId: string, status?: string) {
//     const query: any = { id_prestataire: prestataireId };
//     if (status) {
//       query.status = status;
//     }
//     return this.reservationModel.find(query).exec();
//   }

//   async cancelReservation(id: string): Promise<{
//     canceledReservation: Reservation;
//     matchingReservation?: Reservation;
//   }> {
//     if (!isValidObjectId(id)) {
//       throw new BadRequestException('Invalid reservation ID format');
//     }

//     const reservationToCancel = await this.reservationModel.findById(id).exec();
//     if (!reservationToCancel) {
//       throw new NotFoundException(`Reservation with ID ${id} not found`);
//     }
// <<<<<<< HEAD
// =======

// >>>>>>> 02140b936eb495463fe086ac62088c7aa0f0dd20
//     if (reservationToCancel.status !== 'confirmed') {
//       throw new BadRequestException('Only confirmed reservations can be canceled');
//     }

//     const canceledDateTime = reservationToCancel.date;
//     const startTime = new Date(canceledDateTime.getTime() - 60 * 60 * 1000);
//     const endTime = new Date(canceledDateTime.getTime() + 2 * 60 * 60 * 1000);

//     const waitingReservations = await this.reservationModel
//       .find({
//         id_prestataire: reservationToCancel.id_prestataire,
//         status: 'waiting',
// <<<<<<< HEAD
//         date: { $gte: startTime, $lte: endTime, $ne: canceledDateTime }
// =======
//         date: {
//           $gte: startTime,
//           $lte: endTime,
//           $ne: canceledDateTime,
//         },
// >>>>>>> 02140b936eb495463fe086ac62088c7aa0f0dd20
//       })
//       .sort({ createdAt: 1 })
//       .lean<Reservation[]>()
//       .exec();

//     let promotedReservation: Reservation | null = null;
//     if (waitingReservations.length > 0) {
//       try {
//         promotedReservation = await this.reservationModel.findByIdAndUpdate(
//           waitingReservations[0]._id,
//           { $set: { status: 'pending' } },
// <<<<<<< HEAD
//           { new: true, runValidators: true }
//         ).exec();
// =======
//           { new: true, runValidators: true },
//         ).exec();

// >>>>>>> 02140b936eb495463fe086ac62088c7aa0f0dd20
//         if (!promotedReservation) {
//           throw new NotFoundException('Waiting reservation not found after promotion attempt');
//         }
//       } catch (promotionError) {
// <<<<<<< HEAD
//         throw new InternalServerErrorException(`Failed to promote waiting reservation: ${promotionError.message}`);
// =======
//         throw new InternalServerErrorException(
//           `Failed to promote waiting reservation: ${promotionError.message}`,
//         );
// >>>>>>> 02140b936eb495463fe086ac62088c7aa0f0dd20
//       }
//     }

//     let canceledReservation: Reservation | null;
//     try {
//       canceledReservation = await this.reservationModel.findByIdAndUpdate(
//         id,
//         { $set: { status: 'canceled' } },
// <<<<<<< HEAD
//         { new: true, runValidators: true }
//       ).exec();
//     } catch (cancelError) {
//       if (promotedReservation) {
//         await this.reservationModel.findByIdAndUpdate(promotedReservation._id, { $set: { status: 'waiting' } }).exec();
//       }
//       throw new InternalServerErrorException(`Cancellation failed: ${cancelError.message}`);
// =======
//         { new: true, runValidators: true },
//       ).exec();
//     } catch (cancelError) {
//       if (promotedReservation) {
//         await this.reservationModel.findByIdAndUpdate(
//           promotedReservation._id,
//           { $set: { status: 'waiting' } },
//         ).exec();
//       }
//       throw new InternalServerErrorException(
//         `Cancellation failed: ${cancelError.message}`,
//       );
// >>>>>>> 02140b936eb495463fe086ac62088c7aa0f0dd20
//     }

//     if (!canceledReservation) {
//       throw new NotFoundException('Reservation not found after cancellation attempt');
//     }

//     return {
//       canceledReservation,
// <<<<<<< HEAD
//       ...(promotedReservation && { matchingReservation: promotedReservation })
//     };
//   }

//   // async generateQRCode(reservation: Reservation): Promise<string> {
//   //   const reservationDetails = {
//   //     id: reservation._id,
//   //     prestataireId: reservation.id_prestataire,
//   //     clientId: reservation.id_client,
//   //     date: reservation.date.toISOString(),
//   //     location: reservation.location,
//   //     service: reservation.service,
//   //     price: reservation.price,
//   //     status: reservation.status,
//   //     verificationUrl: `http://f35.local:3000/reservations/verify/${reservation._id}`,
//   //   };
//   //   const qrData = JSON.stringify(reservationDetails);
//   //   return await QRCode.toDataURL(qrData);
//   // }
// =======
//       ...(promotedReservation && { matchingReservation: promotedReservation }),
//     };
//   }

//   async generateQRCode(reservation: Reservation): Promise<string> {
//     const reservationDetails = {
//       id: reservation._id,
//       prestataireId: reservation.id_prestataire,
//       clientId: reservation.id_client,
//       date: reservation.date.toISOString(),
//       location: reservation.location,
//       service: reservation.service,
//       price: reservation.price,
//       status: reservation.status,
//       verificationUrl: `http://f35.local:3000/reservations/verify/${reservation._id}`,
//     };
//     const qrData = JSON.stringify(reservationDetails);
//     return await QRCode.toDataURL(qrData);
//   }

//   async updateReservation(id: string, updateData: Partial<Reservation>): Promise<Reservation> {
//     if (updateData.status === 'confirmed') {
//       const reservation = await this.reservationModel.findById(id).exec();
//       if (!reservation) {
//         throw new NotFoundException(`Réservation avec l'ID ${id} non trouvée`);
//       }
//       const qrCodeDataUrl = await this.generateQRCode(reservation);
//       (updateData as any).qrCode = qrCodeDataUrl;
//       await this.messagesService.saveMessage(
//         reservation.id_prestataire,
//         reservation.id_client,
//         `Votre réservation a été confirmée. Voici votre QR code avec les détails: ${qrCodeDataUrl}`,
//       );
//     }
//     const updatedReservation = await this.reservationModel
//       .findByIdAndUpdate(id, updateData, { new: true })
//       .exec();
//     if (!updatedReservation) {
//       throw new NotFoundException(`Réservation avec l'ID ${id} non trouvée`);
//     }
//     return updatedReservation;
//   }
// >>>>>>> 02140b936eb495463fe086ac62088c7aa0f0dd20

//   async verifyAndCompleteReservation(id: string): Promise<Reservation> {
//     this.logger.log(`Verifying and completing reservation: ${id}`);
//     if (!isValidObjectId(id)) {
//       this.logger.error(`Invalid reservation ID: ${id}`);
//       throw new BadRequestException('Invalid reservation ID');
//     }

//     const reservation = await this.reservationModel.findById(id).exec();
//     if (!reservation) {
//       this.logger.error(`Reservation with ID ${id} not found`);
//       throw new NotFoundException(`Reservation with ID ${id} not found`);
//     }

//     const updatedPrice = reservation.price || 0;
//     const discountApplied = false;

//     this.logger.log(`Updating reservation ${id} with price: ${updatedPrice}, discount: ${discountApplied}`);

//     try {
//       const updatedReservation = await this.reservationModel
//         .findByIdAndUpdate(
//           id,
//           { status: 'completed', price: updatedPrice, discountApplied },
//           { new: true }
//         )
//         .exec();

//       if (!updatedReservation) {
//         this.logger.error(`Failed to update reservation ${id}`);
//         throw new NotFoundException(`Failed to update reservation with ID ${id}`);
//       }

//       const factureData: Partial<Facture> = {
//         reservationId: new Types.ObjectId(id),
//         prestataireId: new Types.ObjectId(reservation.id_prestataire),
//         clientId: new Types.ObjectId(reservation.id_client),
//         service: reservation.service,
//         date: reservation.date,
//         location: reservation.location,
//         price: updatedPrice,
//         discountApplied,
//         request: reservation.request,
//         pdfPath: undefined,
//       };

//       this.logger.log(`Creating facture for reservation ${id} with data: ${JSON.stringify(factureData)}`);
//       const createdFacture = await this.facturesService.createFacture(factureData);
//       this.logger.log(`Facture created for reservation ${id}: ${createdFacture._id}`);

//       return updatedReservation;
//     } catch (error) {
//       this.logger.error(`Error completing reservation ${id}: ${error.message}`);
//       throw new InternalServerErrorException('Error completing reservation: ' + error.message);
//     }
//   }

//   async getPointsForUser(userId: string): Promise<Points[]> {
//     return this.pointsModel.find({ userId }).populate('prestataireId').exec();
//   }

//   async sendLocationCard(
//     reservationId: string,
//     senderId: string,
//     lat: number,
//     lng: number,
//   ): Promise<{ message: any; location: { lat: number; lng: number } }> {
//     if (!isValidObjectId(reservationId) || !isValidObjectId(senderId)) {
//       throw new BadRequestException('Invalid reservationId or senderId');
//     }
//     if (isNaN(lat) || isNaN(lng)) {
//       throw new BadRequestException('Invalid coordinates');
//     }

//     const reservation = await this.reservationModel.findById(reservationId).exec();
//     if (!reservation) {
//       throw new NotFoundException(`Reservation with ID ${reservationId} not found`);
//     }
//     if (reservation.status !== 'confirmed') {
//       throw new BadRequestException('Reservation must be confirmed to send location');
//     }
//     if (reservation.id_prestataire.toString() !== senderId) {
//       throw new BadRequestException('Only the prestataire can send location');
//     }

//     try {
//       const savedLocation = await this.locationService.updateLocation(senderId, reservationId, { lat, lng });

//       const message = await this.messagesService.saveMessage(
//         senderId,
//         reservation.id_client.toString(),
//         'Prestataire location shared',
//         true,
//         { lat, lng },
//         reservationId,
//       );

//       if (this.io) {
//         this.io.to(reservation.id_client.toString()).emit('updateLocation', {
//           prestataireId: senderId,
//           reservationId,
//           coordinates: { lat, lng },
//           timestamp: savedLocation.updatedAt,
//         });
//         this.logger.log(`Location update emitted for client ${reservation.id_client} on reservation ${reservationId}`);
//       }

//       return {
//         message,
//         location: { lat, lng },
//       };
//     } catch (error) {
//       this.logger.error(`Error in sendLocationCard: ${error.message}`);
//       throw new InternalServerErrorException(`Failed to send location card: ${error.message}`);
//     }
//   }

//   async submitRating(reservationId: string, prestataireId: string, rating: number): Promise<void> {
//     if (!isValidObjectId(reservationId) || !isValidObjectId(prestataireId)) {
//       throw new BadRequestException('Invalid reservation or prestataire ID');
//     }
//     if (rating < 1 || rating > 5) {
//       throw new BadRequestException('Rating must be between 1 and 5');
//     }

//     const reservation = await this.reservationModel.findById(reservationId);
//     if (!reservation) {
//       throw new NotFoundException('Réservation non trouvée');
//     }
//     if (reservation.status !== 'completed') {
//       throw new BadRequestException('Seules les réservations terminées peuvent être évaluées');
//     }
//     if (reservation.isRated) {
//       throw new BadRequestException('Cette réservation a déjà été évaluée');
//     }

//     const prestataire = await this.prestataireModel.findById(prestataireId);
//     if (!prestataire) {
//       throw new NotFoundException('Prestataire non trouvé');
//     }

//     const newRatingCount = prestataire.ratingCount + 1;
//     const newRating = (prestataire.rating * prestataire.ratingCount + rating) / newRatingCount;

//     await this.prestataireModel.findByIdAndUpdate(
//       prestataireId,
//       { rating: newRating, ratingCount: newRatingCount },
//       { new: true }
//     ).exec();

//     await this.reservationModel.findByIdAndUpdate(
//       reservationId,
//       { isRated: true },
//       { new: true }
//     ).exec();
//   }

//   async getReservationsByPrestataireAndStatus(prestataireId: string, status?: string): Promise<Reservation[]> {
//     const query: any = { id_prestataire: prestataireId };
//     if (status) {
//       query.status = status;
//     }
//     return this.reservationModel.find(query).exec();
//   }

// async updateReservation(id: string, updateData: Partial<Reservation>): Promise<Reservation> {
//   this.logger.log(`[DEBUG] Updating reservation ${id} with data: ${JSON.stringify(updateData)}`);
//   try {
//     if (!isValidObjectId(id)) {
//       this.logger.error(`[DEBUG] Invalid reservation ID: ${id}`);
//       throw new BadRequestException('Invalid reservation ID');
//     }

//     const reservation = await this.reservationModel.findById(id).exec();
//     if (!reservation) {
//       this.logger.error(`[DEBUG] Reservation with ID ${id} not found`);
//       throw new NotFoundException(`Réservation avec l'ID ${id} non trouvée`);
//     }

//     if (updateData.status === 'confirmed') {
//       this.logger.log(`[DEBUG] Confirming reservation ${id}`);
//       try {
//         this.logger.log(`[DEBUG] Generating QR code for reservation ${id}`);
//         let qrCodeDataUrl;
//         try {
//           qrCodeDataUrl = await this.generateQRCode(reservation);
//           (updateData as any).qrCode = qrCodeDataUrl;
//           this.logger.log(`[DEBUG] QR code generated successfully`);
//         } catch (qrError) {
//           this.logger.error(`[DEBUG] QR code generation failed: ${qrError.message}`);
//           throw new InternalServerErrorException(`Failed to generate QR code: ${qrError.message}`);
//         }

//         this.logger.log(`[DEBUG] Sending confirmation message for reservation ${id}`);
//         try {
//           await this.messagesService.saveMessage(
//             reservation.id_prestataire.toString(),
//             reservation.id_client.toString(),
//             `Votre réservation a été confirmée. Voici votre QR code avec les détails: ${qrCodeDataUrl}`,
//           );
//           this.logger.log(`[DEBUG] Confirmation message sent successfully`);
//         } catch (msgError) {
//           this.logger.error(`[DEBUG] Message sending failed: ${msgError.message}`);
//           throw new InternalServerErrorException(`Failed to send confirmation message: ${msgError.message}`);
//         }

//         this.logger.log(`[DEBUG] Fetching email for client ${reservation.id_client}`);
//         const userEmail = await this.getUserEmail(reservation.id_client.toString());
//         if (userEmail) {
//           this.logger.log(`[DEBUG] Attempting to send acceptance email to ${userEmail}`);
//           const emailSent = await this.sendEmail(
//             userEmail,
//             'Réservation Acceptée',
//             'Votre réservation a été confirmée avec succès.'
//           );
//           if (emailSent) {
//             this.logger.log(`[DEBUG] Acceptance email sent successfully to ${userEmail}`);
//           } else {
//             this.logger.warn(`[DEBUG] Acceptance email failed for ${userEmail}`);
//           }
//         } else {
//           this.logger.warn(`[DEBUG] No email found for client ${reservation.id_client}`);
//         }
//       } catch (error) {
//         this.logger.error(`[DEBUG] Confirmation process failed: ${error.message}`);
//         throw error;
//       }
//     }

//     this.logger.log(`[DEBUG] Updating reservation in database with data: ${JSON.stringify(updateData)}`);
//     const updatedReservation = await this.reservationModel
//       .findByIdAndUpdate(id, updateData, { new: true })
//       .exec();
//     if (!updatedReservation) {
//       this.logger.error(`[DEBUG] Failed to update reservation ${id}`);
//       throw new NotFoundException(`Réservation avec l'ID ${id} non trouvée`);
//     }

//     this.logger.log(`[DEBUG] Reservation ${id} updated successfully`);
//     return updatedReservation;
//   } catch (error) {
//     this.logger.error(`[DEBUG] Error updating reservation ${id}: ${error.message}`);
//     throw error instanceof HttpException ? error : new InternalServerErrorException(`Error updating reservation: ${error.message}`);
//   }
// }
// async deleteReservation(id: string): Promise<{ success: boolean; message: string; data?: any }> {
//   this.logger.log(`[DEBUG] Deleting reservation ${id}`);
//   if (!isValidObjectId(id)) {
//     this.logger.error(`[DEBUG] Invalid reservation ID: ${id}`);
//     throw new BadRequestException('Invalid reservation ID');
//   }

//   const reservation = await this.reservationModel.findById(id).exec();
//   if (!reservation) {
//     this.logger.error(`[DEBUG] Reservation with ID ${id} not found`);
//     throw new NotFoundException('Réservation non trouvée');
//   }

//   this.logger.log(`[DEBUG] Reservation found: ${JSON.stringify(reservation.toObject())}`);

//   let emailSent = false;
//   const userEmail = await this.getUserEmail(reservation.id_client.toString());
//   if (userEmail) {
//     this.logger.log(`[DEBUG] Sending rejection email to ${userEmail}`);
//     emailSent = await this.sendEmail(userEmail, 'Réservation Refusée', 'Votre réservation a été refusée.');
//     if (emailSent) {
//       this.logger.log(`[DEBUG] Rejection email sent successfully to ${userEmail}`);
//     } else {
//       this.logger.warn(`[DEBUG] Rejection email failed for ${userEmail}`);
//     }
//   } else {
//     this.logger.warn(`[DEBUG] No email found for client ${reservation.id_client}`);
//   }

//   const wasConfirmed = reservation.status === 'confirmed';
//   const prestataireId = reservation.id_prestataire.toString();
//   const reservationDate = reservation.date;

//   const result = await this.reservationModel.findByIdAndDelete(id).exec();
//   if (!result) {
//     this.logger.error(`[DEBUG] Failed to delete reservation ${id}`);
//     throw new NotFoundException('Réservation avec l\'ID ${id} non trouvée');
//   }

//   if (wasConfirmed) {
//     try {
//       this.logger.log(`[DEBUG] Promoting waiting reservation for prestataire ${prestataireId}`);
//       await this.promoteFirstWaitingReservation(prestataireId, reservationDate);
//     } catch (promotionError) {
//       this.logger.error(`[DEBUG] Failed to promote waiting reservation: ${promotionError.message}`);
//     }
//   }

//   this.logger.log(`[DEBUG] Reservation ${id} deleted successfully`);
//   return {
//     success: true,
//     message: 'Réservation supprimée avec succès',
//     data: { emailSent, reservationId: id },
//   };
// }

//   private async getUserEmail(userId: string): Promise<string | null> {
//     const client = await this.clientModel.findById(userId).exec();
//     if (client?.email) {
//       return client.email;
//     }
//     const prestataire = await this.prestataireModel.findById(userId).exec();
//     if (prestataire?.email) {
//       return prestataire.email;
//     }
//     return null;
//   }



// //   async promoteFirstWaitingReservation(prestataireId: string, date: Date): Promise<void> {
// //   this.logger.log(`[DEBUG] Promoting first waiting reservation for prestataire ${prestataireId} around date ${date}`);
  
// //   const twoHoursBefore = new Date(date.getTime() - 2 * 60 * 60 * 1000);
// //   const oneHourAfter = new Date(date.getTime() + 60 * 60 * 1000);

// //   const waitingReservations = await this.reservationModel
// //     .find({
// //       id_prestataire: prestataireId,
// //       status: 'waiting',
// //       date: { $gte: twoHoursBefore, $lte: oneHourAfter },
// //     })
// //     .populate('id_client', 'email name') // Populate client details for email
// //     .sort({ createdAt: 1 })
// //     .exec();

// //   if (waitingReservations.length > 0) {
// //     const firstInLine = waitingReservations[0];
// //     try {
// //       const updatedReservation = await this.reservationModel
// //         .findByIdAndUpdate(
// //           firstInLine._id,
// //           { status: 'pending' },
// //           { new: true }
// //         )
// //         .populate('id_client', 'email name')
// //         .populate('id_prestataire', 'name') // Populate prestataire name for email content
// //         .exec();

// //       if (!updatedReservation) {
// //         this.logger.error(`[DEBUG] Failed to promote reservation ${firstInLine._id} to pending`);
// //         return;
// //       }

// //       this.logger.log(`[DEBUG] Promoted reservation ${firstInLine._id} to pending`);

// //       // Send email to client
// //       const client = updatedReservation.id_client as any;
// //       const prestataire = updatedReservation.id_prestataire as any;
// //       const clientEmail = client?.email;
// //       const reservationDate = new Date(updatedReservation.date).toLocaleString();

// //       if (clientEmail) {
// //         const subject = 'Votre Réservation est en Attente de Confirmation';
// //         const message = `
// //           Bonjour ${client.name || 'Client'},
// //           Votre réservation en attente a été promue au statut "en attente de confirmation".
// //           Détails de la réservation :
// //           - Service : ${updatedReservation.service || 'N/A'}
// //           - Prestataire : ${prestataire?.name || 'N/A'}
// //           - Date : ${reservationDate}
// //           - Lieu : ${updatedReservation.location || 'N/A'}
// //           Veuillez attendre la confirmation finale du prestataire.
// //         `;

// //         const emailSent = await this.sendEmail(clientEmail, subject, message);
// //         if (emailSent) {
// //           this.logger.log(`[DEBUG] Promotion email sent to client ${clientEmail} for reservation ${firstInLine._id}`);
// //         } else {
// //           this.logger.warn(`[DEBUG] Failed to send promotion email to client ${clientEmail} for reservation ${firstInLine._id}`);
// //         }
// //       } else {
// //         this.logger.warn(`[DEBUG] No email found for client ${updatedReservation.id_client} in reservation ${firstInLine._id}`);
// //       }
// //     } catch (error) {
// //       this.logger.error(`[ERROR] Failed to promote reservation ${firstInLine._id}: ${error.message}`);
// //       throw new InternalServerErrorException(`Failed to promote reservation: ${error.message}`);
// //     }
// //   } else {
// //     this.logger.log(`[DEBUG] No waiting reservations found for prestataire ${prestataireId}`);
// //   }
// // }

//   async generateQRCode(reservation: Reservation): Promise<string> {
//     const reservationDetails = {
//       id: reservation._id,
//       prestataireId: reservation.id_prestataire,
//       clientId: reservation.id_client,
//       date: reservation.date.toISOString(),
//       location: reservation.location,
//       service: reservation.service,
//       price: reservation.price,
//       status: reservation.status,
//       verificationUrl: `http://f35.local:3000/reservations/verify/${reservation._id}`,
//     };
//     const qrData = JSON.stringify(reservationDetails);
//     return await QRCode.toDataURL(qrData);
//   }








// // New method to send reminders for tomorrow's confirmed reservations
//   async sendTomorrowReservationReminders(): Promise<void> {
//     this.logger.log('[DEBUG] Checking for confirmed reservations scheduled for tomorrow');

//     try {
//       // Get tomorrow's date range
//       const tomorrow = new Date();
//       tomorrow.setDate(tomorrow.getDate() + 1);
//       tomorrow.setHours(0, 0, 0, 0); // Start of tomorrow
//       const tomorrowEnd = new Date(tomorrow);
//       tomorrowEnd.setHours(23, 59, 59, 999); // End of tomorrow

//       // Find confirmed reservations for tomorrow
//       const reservations = await this.reservationModel
//         .find({
//           status: 'confirmed',
//           date: { $gte: tomorrow, $lte: tomorrowEnd },
//         })
//         .populate('id_client', 'email name')
//         .populate('id_prestataire', 'email name')
//         .exec();

//       this.logger.log(`[DEBUG] Found ${reservations.length} confirmed reservations for tomorrow`);

//       // Process each reservation
//       for (const reservation of reservations) {
//         const client = reservation.id_client as any;
//         const prestataire = reservation.id_prestataire as any;

//         if (!client || !prestataire) {
//           this.logger.warn(`[DEBUG] Missing client or prestataire for reservation ${reservation._id}`);
//           continue;
//         }

//         const clientEmail = client.email;
//         const prestataireEmail = prestataire.email;
//         const reservationDate = new Date(reservation.date).toLocaleString();

//         // Prepare email content
//         const subject = 'Rappel : Réservation pour demain';
//         const clientMessage = `
//           Bonjour ${client.name || 'Client'},
//           Ceci est un rappel pour votre réservation confirmée prévue demain à ${reservationDate}.
//           Service: ${reservation.service || 'N/A'}
//           Prestataire: ${prestataire.name || 'N/A'}
//           Lieu: ${reservation.location || 'N/A'}
//           Merci de vous présenter à l'heure convenue.
//         `;
//         const prestataireMessage = `
//           Bonjour ${prestataire.name || 'Prestataire'},
//           Ceci est un rappel pour votre réservation confirmée prévue demain à ${reservationDate}.
//           Service: ${reservation.service || 'N/A'}
//           Client: ${client.name || 'N/A'}
//           Lieu: ${reservation.location || 'N/A'}
//           Veuillez vous assurer d'être prêt pour le rendez-vous.
//         `;

//         // Send email to client
//         if (clientEmail) {
//           const clientEmailSent = await this.sendEmail(clientEmail, subject, clientMessage);
//           if (clientEmailSent) {
//             this.logger.log(`[DEBUG] Reminder email sent to client ${clientEmail} for reservation ${reservation._id}`);
//           } else {
//             this.logger.warn(`[DEBUG] Failed to send reminder email to client ${clientEmail} for reservation ${reservation._id}`);
//           }
//         } else {
//           this.logger.warn(`[DEBUG] No email found for client ${reservation.id_client} in reservation ${reservation._id}`);
//         }

//         // Send email to prestataire
//         if (prestataireEmail) {
//           const prestataireEmailSent = await this.sendEmail(prestataireEmail, subject, prestataireMessage);
//           if (prestataireEmailSent) {
//             this.logger.log(`[DEBUG] Reminder email sent to prestataire ${prestataireEmail} for reservation ${reservation._id}`);
//           } else {
//             this.logger.warn(`[DEBUG] Failed to send reminder email to prestataire ${prestataireEmail} for reservation ${reservation._id}`);
//           }
//         } else {
//           this.logger.warn(`[DEBUG] No email found for prestataire ${reservation.id_prestataire} in reservation ${reservation._id}`);
//         }
//       }
//     } catch (error) {
//       this.logger.error(`[ERROR] Failed to send tomorrow's reservation reminders: ${error.message}`);
//       throw new InternalServerErrorException('Failed to send reservation reminders');
//     }
//   }
// // Scheduled task to run daily at 8 AM
//   @Cron(CronExpression.EVERY_DAY_AT_8AM)
//   async handleDailyReminderTask() {
//     this.logger.log('[DEBUG] Running daily reservation reminder task');
//     await this.sendTomorrowReservationReminders();
//     this.logger.log('[DEBUG] Daily reservation reminder task completed');
//   }






//   //lele dashboard
//   async getDetailedStatistics(): Promise<any> {
//     const totalClients = await this.clientModel.countDocuments().exec();
//     const totalPrestataires = await this.prestataireModel.countDocuments().exec();
//     const totalReservations = await this.reservationModel.countDocuments().exec();
//     const totalReservationsByStatus = await this.reservationModel.aggregate([
//       { $group: { _id: '$status', count: { $sum: 1 } } }
//     ]).exec();
//     const mostActiveClients = await this.reservationModel.aggregate([
//       { $group: { _id: '$id_client', count: { $sum: 1 } } },
//       { $lookup: { from: 'clients', localField: '_id', foreignField: '_id', as: 'client' } },
//       { $unwind: '$client' },
//       { $project: { clientName: '$client.name', count: 1 } },
//       { $sort: { count: -1 } },
//       { $limit: 5 }
//     ]).exec();
//     const mostBookedPrestataires = await this.reservationModel.aggregate([
//       { $group: { _id: '$id_prestataire', count: { $sum: 1 } } },
//       { $lookup: { from: 'prestataires', localField: '_id', foreignField: '_id', as: 'prestataire' } },
//       { $unwind: '$prestataire' },
//       { $project: { prestataireName: '$prestataire.name', count: 1 } },
//       { $sort: { count: -1 } },
//       { $limit: 5 }
//     ]).exec();
//     const reservationsByCategory = await this.reservationModel.aggregate([
//       { $lookup: { from: 'prestataires', localField: 'id_prestataire', foreignField: '_id', as: 'prestataire' } },
//       { $unwind: '$prestataire' },
//       { $group: { _id: '$prestataire.category', count: { $sum: 1 } } }
//     ]).exec();

//     return {
//       totalClients,
//       totalPrestataires,
//       totalReservations,
//       totalReservationsByStatus: totalReservationsByStatus.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
//       mostActiveClients,
//       mostBookedPrestataires,
//       reservationsByCategory
//     };
//   }

//       );
//       console.log(`Rating prompt message sent: ID=${ratingMessage._id}, to=${reservation.id_client}, reservation=${id}`);

//       this.io.to(reservation.id_client.toString()).emit('trigger-rating', {
//         reservationId: id,
//         prestataireId: reservation.id_prestataire.toString(),
//         clientId: reservation.id_client.toString(),
//       });
//       console.log(`Emitted trigger-rating to client ${reservation.id_client}`);
//     } catch (e) {
//       console.error(`Failed to send rating prompt for reservation ${id}: ${e}`);
//     }

//     return updatedReservation;
//   }


//   async getPointsForUser(userId: string): Promise<Points[]> {
//     return this.pointsModel.find({ userId }).populate('prestataireId').exec();
//   }

//   async sendLocationCard(
//     reservationId: string,
//     senderId: string,
//     lat: number,
//     lng: number,
//   ): Promise<{ message: any; location: { lat: number; lng: number } }> {
//     if (!isValidObjectId(reservationId) || !isValidObjectId(senderId)) {
//       throw new BadRequestException('Invalid reservationId or senderId');
//     }
//     if (isNaN(lat) || isNaN(lng)) {
//       throw new BadRequestException('Invalid coordinates');
//     }

//     const reservation = await this.reservationModel.findById(reservationId).exec();
//     if (!reservation) {
//       throw new NotFoundException(`Reservation with ID ${reservationId} not found`);
//     }
//     if (reservation.status !== 'confirmed') {
//       throw new BadRequestException('Reservation must be confirmed to send location');
//     }
//     if (reservation.id_prestataire.toString() !== senderId) {
//       throw new BadRequestException('Only the prestataire can send location');
//     }

//     try {
//       const savedLocation = await this.locationService.updateLocation(senderId, reservationId, { lat, lng });

//       const message = await this.messagesService.saveMessage(
//         senderId,
//         reservation.id_client.toString(),
//         'Prestataire location shared',
//         true,
//         { lat, lng },
//         reservationId,
//       );

//       if (this.io) {
//         this.io.to(reservation.id_client.toString()).emit('updateLocation', {
//           prestataireId: senderId,
//           reservationId,
//           coordinates: { lat, lng },
//           timestamp: savedLocation.updatedAt,
//         });
//         console.log(`Location update emitted for client ${reservation.id_client} on reservation ${reservationId}`);
//       }

//       return {
//         message,
//         location: { lat, lng },
//       };
//     } catch (error) {
//       console.error(`Error in sendLocationCard: ${error.message}`);
//       throw new InternalServerErrorException(`Failed to send location card: ${error.message}`);
//     }
//   }

//   async submitRating(reservationId: string, prestataireId: string, rating: number): Promise<void> {
//     if (!isValidObjectId(reservationId) || !isValidObjectId(prestataireId)) {
//       throw new BadRequestException('Invalid reservation or prestataire ID');
//     }
//     if (rating < 1 || rating > 5) {
//       throw new BadRequestException('Rating must be between 1 and 5');
//     }

//     const reservation = await this.reservationModel.findById(reservationId);
//     if (!reservation) {
//       throw new NotFoundException('Réservation non trouvée');
//     }
//     if (reservation.status !== 'completed') {
//       throw new BadRequestException('Seules les réservations terminées peuvent être évaluées');
//     }
//     if (reservation.isRated) {
//       throw new BadRequestException('Cette réservation a déjà été évaluée');
//     }

//     const prestataire = await this.prestataireModel.findById(prestataireId);
//     if (!prestataire) {
//       throw new NotFoundException('Prestataire non trouvé');
//     }

//     const newRatingCount = prestataire.ratingCount + 1;
//     const newRating = 
//       (prestataire.rating * prestataire.ratingCount + rating) / newRatingCount;

//     await this.prestataireModel.findByIdAndUpdate(
//       prestataireId,
//       {
//         rating: newRating,
//         ratingCount: newRatingCount,
//       },
//       { new: true }
//     ).exec();

//     await this.reservationModel.findByIdAndUpdate(
//       reservationId,
//       { isRated: true },
//       { new: true }
//     ).exec();
//   }
// }

import { BadRequestException, HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
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
import { FacturesService } from 'src/factures/factures.service';
import { Facture } from 'src/factures/facture.schema';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ReservationsService {
  private io: Server;
  private readonly logger = new Logger(ReservationsService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(
    @InjectModel('Reservation') private reservationModel: Model<Reservation>,
    private messagesService: MessagesService,
    @InjectModel('Client') private clientModel: Model<Client>,
    @InjectModel('Prestataire') private prestataireModel: Model<Prestataire>,
    @InjectModel('Points') private pointsModel: Model<Points>,
    private locationService: LocationService,
    private facturesService: FacturesService,
    private configService: ConfigService,
  ) {
    this.initializeTransporter()
      .then(() => this.logger.log('[DEBUG] Email transporter initialized successfully'))
      .catch((error) => {
        this.logger.error(`[ERROR] Failed to initialize transporter: ${error.message}`);
      });
  }

  private async initializeTransporter(): Promise<void> {
    const emailUser = this.configService.get<string>('EMAIL_USER');
    const emailPass = this.configService.get<string>('EMAIL_PASS');
    const emailHost = this.configService.get<string>('EMAIL_HOST');
    const emailPort = this.configService.get<number>('EMAIL_PORT');

    this.logger.debug(`[DEBUG] Initializing transporter with: user=${emailUser}, host=${emailHost}, port=${emailPort}`);

    if (!emailUser || !emailPass || !emailHost || !emailPort) {
      throw new Error('Missing email configuration (EMAIL_USER, EMAIL_PASS, EMAIL_HOST, EMAIL_PORT)');
    }

    this.transporter = nodemailer.createTransport({
      host: emailHost,
      port: emailPort,
      secure: emailPort === 465,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    try {
      await this.transporter.verify();
      this.logger.log('[DEBUG] Email transporter verified and ready.');
    } catch (err) {
      this.transporter = null;
      throw new Error(`Failed to verify transporter: ${err.message}`);
    }
  }

  setSocketIo(io: Server) {
    this.io = io;
  }

  async sendEmail(to: string, subject: string, text: string): Promise<boolean> {
    this.logger.log(`[DEBUG] Sending email to ${to}`);

    if (!to || !subject || !text) {
      this.logger.error('[DEBUG] Invalid email parameters');
      return false;
    }

    if (!this.transporter) {
      try {
        await this.initializeTransporter();
        if (!this.transporter) {
          this.logger.error('[DEBUG] Email transporter not available after reinitialization');
          return false;
        }
      } catch (initError) {
        this.logger.error(`[DEBUG] Failed to reinitialize transporter: ${initError.message}`);
        return false;
      }
    }

    const mailOptions = {
      from: `"Fixaura Platform" <${this.configService.get<string>('EMAIL_USER')}>`,
      to,
      subject,
      text,
      html: `
        <div style="font-family: Arial; padding: 20px;">
          <h2>${subject}</h2>
          <p>${text}</p>
          <p>Merci de faire confiance à <strong>Fixaura</strong> !</p>
          <p style="font-size: 12px;">Si vous n'avez pas initié cette action, contactez-nous à support@fixaura.com.</p>
        </div>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`[DEBUG] Email sent to ${to}: ID ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`[DEBUG] Failed to send email to ${to}: ${error.message}`);
      if (error.code === 'ESOCKET' || error.message.includes('ECONNRESET')) {
        this.logger.warn('[DEBUG] Connection error detected; resetting transporter');
        this.transporter = null;
      }
      return false;
    }
  }

  async createReservation(reservationData: Partial<Reservation>): Promise<Reservation> {
    this.logger.log(`[DEBUG] Creating reservation with data: ${JSON.stringify(reservationData)}`);

    if (!reservationData.id_client || !isValidObjectId(reservationData.id_client)) {
      this.logger.error(`[DEBUG] Invalid client ID: ${reservationData.id_client}`);
      throw new BadRequestException('ID client invalide');
    }
    if (!reservationData.id_prestataire || !isValidObjectId(reservationData.id_prestataire)) {
      this.logger.error(`[DEBUG] Invalid prestataire ID: ${reservationData.id_prestataire}`);
      throw new BadRequestException('ID prestataire invalide');
    }
    if (reservationData.id_client === reservationData.id_prestataire) {
      this.logger.error('[DEBUG] Self-reservation attempted');
      throw new BadRequestException('Auto-réservation non autorisée');
    }
    if (!reservationData.date) {
      this.logger.error('[DEBUG] Missing reservation date');
      throw new BadRequestException('Date de réservation requise');
    }

    let date = new Date(reservationData.date);
    date.setHours(date.getHours() + 1);
    if (isNaN(date.getTime())) {
      this.logger.error(`[DEBUG] Invalid date format: ${reservationData.date}`);
      throw new BadRequestException('Format de date invalide');
    }

    const utcDate = new Date(Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds()
    ));

    const oneHourBefore = new Date(utcDate.getTime() - 60 * 60 * 1000);
    const twoHoursAfter = new Date(utcDate.getTime() + 2 * 60 * 60 * 1000);

    this.logger.log(`[DEBUG] Checking for conflicting reservations for prestataire ${reservationData.id_prestataire}`);
    const conflictingReservations = await this.reservationModel.find({
      id_prestataire: reservationData.id_prestataire,
      status: 'confirmed',
      date: { $gte: oneHourBefore, $lte: twoHoursAfter }
    }).exec();

    try {
      const newReservation = new this.reservationModel({
        ...reservationData,
        date: utcDate,
        status: conflictingReservations.length > 0 ? 'waiting' : 'pending'
      });

      this.logger.log('[DEBUG] Saving new reservation');
      const savedReservation = await newReservation.save();
      this.logger.log(`[DEBUG] Reservation saved with ID: ${savedReservation._id}`);

      let populated: any = savedReservation;
      try {
        populated = await this.reservationModel
          .findById(savedReservation._id)
          .populate('id_client', 'name email phoneNumber')
          .lean()
          .exec();
        if (!populated) {
          this.logger.warn(`[DEBUG] Reservation ${savedReservation._id} not found after save`);
        }
      } catch (populateError) {
        this.logger.warn(`[DEBUG] Failed to populate client for reservation ${savedReservation._id}: ${populateError.message}`);
        populated = savedReservation.toObject();
      }

      if (this.io) {
        this.logger.log(`[DEBUG] Emitting newReservation event for prestataire ${reservationData.id_prestataire}`);
        this.io.emit('newReservation', {
          prestataireId: reservationData.id_prestataire,
          reservationId: savedReservation.id.toString()
        });
      }

      return {
        ...populated,
        _id: populated._id.toString(),
        id_client: populated.id_client?._id?.toString() || reservationData.id_client,
        id_prestataire: populated.id_prestataire?.toString() || reservationData.id_prestataire,
        date: new Date(populated.date).toISOString()
      } as unknown as Reservation;
    } catch (error) {
      this.logger.error(`[ERROR] Failed to create reservation: ${error.message}, Stack: ${error.stack}`);
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Erreur inconnue'
      );
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

  async getReservationsByPrestataireAndStatus(prestataireId: string, status?: string): Promise<Reservation[]> {
    const query: any = { id_prestataire: prestataireId };
    if (status) {
      query.status = status;
    }
    return this.reservationModel.find(query).exec();
  }

  async findByPrestataire(prestataireId: string, status?: string) {
    const query: any = { id_prestataire: prestataireId };
    if (status) {
      query.status = status;
    }
    return this.reservationModel.find(query).exec();
  }

  async deleteReservation(id: string): Promise<{ success: boolean; message: string; data?: any }> {
    this.logger.log(`[DEBUG] Deleting reservation ${id}`);
    if (!isValidObjectId(id)) {
      this.logger.error(`[DEBUG] Invalid reservation ID: ${id}`);
      throw new BadRequestException('Invalid reservation ID');
    }

    const reservation = await this.reservationModel.findById(id).exec();
    if (!reservation) {
      this.logger.error(`[DEBUG] Reservation with ID ${id} not found`);
      throw new NotFoundException('Réservation non trouvée');
    }

    this.logger.log(`[DEBUG] Reservation found: ${JSON.stringify(reservation.toObject())}`);

    let emailSent = false;
    const userEmail = await this.getUserEmail(reservation.id_client.toString());
    if (userEmail) {
      this.logger.log(`[DEBUG] Sending rejection email to ${userEmail}`);
      emailSent = await this.sendEmail(userEmail, 'Réservation Refusée', 'Votre réservation a été refusée.');
      if (emailSent) {
        this.logger.log(`[DEBUG] Rejection email sent successfully to ${userEmail}`);
      } else {
        this.logger.warn(`[DEBUG] Rejection email failed for ${userEmail}`);
      }
    } else {
      this.logger.warn(`[DEBUG] No email found for client ${reservation.id_client}`);
    }

    const wasConfirmed = reservation.status === 'confirmed';
    const prestataireId = reservation.id_prestataire.toString();
    const reservationDate = reservation.date;

    const result = await this.reservationModel.findByIdAndDelete(id).exec();
    if (!result) {
      this.logger.error(`[DEBUG] Failed to delete reservation ${id}`);
      throw new NotFoundException(`Réservation avec l'ID ${id} non trouvée`);
    }

    if (wasConfirmed) {
      try {
        this.logger.log(`[DEBUG] Promoting waiting reservation for prestataire ${prestataireId}`);
        await this.promoteFirstWaitingReservation(prestataireId, reservationDate);
      } catch (promotionError) {
        this.logger.error(`[DEBUG] Failed to promote waiting reservation: ${promotionError.message}`);
      }
    }

    this.logger.log(`[DEBUG] Reservation ${id} deleted successfully`);
    return {
      success: true,
      message: 'Réservation supprimée avec succès',
      data: { emailSent, reservationId: id },
    };
  }
  private async getUserEmail(userId: string): Promise<string | null> {
    const client = await this.clientModel.findById(userId).exec();
    if (client?.email) {
      return client.email;
    }
    const prestataire = await this.prestataireModel.findById(userId).exec();
    if (prestataire?.email) {
      return prestataire.email;
    }
    return null;
  }
  async updateReservation(id: string, updateData: Partial<Reservation>): Promise<Reservation> {
    this.logger.log(`[DEBUG] Updating reservation ${id} with data: ${JSON.stringify(updateData)}`);
    try {
      if (!isValidObjectId(id)) {
        this.logger.error(`[DEBUG] Invalid reservation ID: ${id}`);
        throw new BadRequestException('Invalid reservation ID');
      }

      const reservation = await this.reservationModel.findById(id).exec();
      if (!reservation) {
        this.logger.error(`[DEBUG] Reservation with ID ${id} not found`);
        throw new NotFoundException(`Réservation avec l'ID ${id} non trouvée`);
      }

      if (updateData.status === 'confirmed') {
        this.logger.log(`[DEBUG] Confirming reservation ${id}`);
        try {
          this.logger.log(`[DEBUG] Generating QR code for reservation ${id}`);
          let qrCodeDataUrl;
          try {
            qrCodeDataUrl = await this.generateQRCode(reservation);
            (updateData as any).qrCode = qrCodeDataUrl;
            this.logger.log(`[DEBUG] QR code generated successfully`);
          } catch (qrError) {
            this.logger.error(`[DEBUG] QR code generation failed: ${qrError.message}`);
            throw new InternalServerErrorException(`Failed to generate QR code: ${qrError.message}`);
          }

          this.logger.log(`[DEBUG] Sending confirmation message for reservation ${id}`);
          try {
            await this.messagesService.saveMessage(
              reservation.id_prestataire.toString(),
              reservation.id_client.toString(),
              `Votre réservation a été confirmée. Voici votre QR code avec les détails: ${qrCodeDataUrl}`,
            );
            this.logger.log(`[DEBUG] Confirmation message sent successfully`);
          } catch (msgError) {
            this.logger.error(`[DEBUG] Message sending failed: ${msgError.message}`);
            throw new InternalServerErrorException(`Failed to send confirmation message: ${msgError.message}`);
          }

          this.logger.log(`[DEBUG] Fetching email for client ${reservation.id_client}`);
          const userEmail = await this.getUserEmail(reservation.id_client.toString());
          if (userEmail) {
            this.logger.log(`[DEBUG] Attempting to send acceptance email to ${userEmail}`);
            const emailSent = await this.sendEmail(
              userEmail,
              'Réservation Acceptée',
              'Votre réservation a été confirmée avec succès.'
            );
            if (emailSent) {
              this.logger.log(`[DEBUG] Acceptance email sent successfully to ${userEmail}`);
            } else {
              this.logger.warn(`[DEBUG] Acceptance email failed for ${userEmail}`);
            }
          } else {
            this.logger.warn(`[DEBUG] No email found for client ${reservation.id_client}`);
          }
        } catch (error) {
          this.logger.error(`[DEBUG] Confirmation process failed: ${error.message}`);
          throw error;
        }
      }

      this.logger.log(`[DEBUG] Updating reservation in database with data: ${JSON.stringify(updateData)}`);
      const updatedReservation = await this.reservationModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .exec();
      if (!updatedReservation) {
        this.logger.error(`[DEBUG] Failed to update reservation ${id}`);
        throw new NotFoundException(`Réservation avec l'ID ${id} non trouvée`);
      }

      this.logger.log(`[DEBUG] Reservation ${id} updated successfully`);
      return updatedReservation;
    } catch (error) {
      this.logger.error(`[DEBUG] Error updating reservation ${id}: ${error.message}`);
      throw error instanceof HttpException ? error : new InternalServerErrorException(`Error updating reservation: ${error.message}`);
    }
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

  async verifyAndCompleteReservation(id: string): Promise<Reservation> {
    this.logger.log(`Verifying and completing reservation: ${id}`);
    if (!isValidObjectId(id)) {
      this.logger.error(`Invalid reservation ID: ${id}`);
      throw new BadRequestException('Invalid reservation ID');
    }

    const reservation = await this.reservationModel.findById(id).exec();
    if (!reservation) {
      this.logger.error(`Reservation with ID ${id} not found`);
      throw new NotFoundException(`Reservation with ID ${id} not found`);
    }

    const updatedPrice = reservation.price || 0;
    const discountApplied = false;

    this.logger.log(`Updating reservation ${id} with price: ${updatedPrice}, discount: ${discountApplied}`);

    try {
      const updatedReservation = await this.reservationModel
        .findByIdAndUpdate(
          id,
          { status: 'completed', price: updatedPrice, discountApplied },
          { new: true }
        )
        .exec();

      if (!updatedReservation) {
        this.logger.error(`Failed to update reservation ${id}`);
        throw new NotFoundException(`Failed to update reservation with ID ${id}`);
      }

      const factureData: Partial<Facture> = {
        reservationId: new Types.ObjectId(id),
        prestataireId: new Types.ObjectId(reservation.id_prestataire),
        clientId: new Types.ObjectId(reservation.id_client),
        service: reservation.service,
        date: reservation.date,
        location: reservation.location,
        price: updatedPrice,
        discountApplied,
        request: reservation.request,
        pdfPath: undefined,
      };

      this.logger.log(`Creating facture for reservation ${id} with data: ${JSON.stringify(factureData)}`);
      const createdFacture = await this.facturesService.createFacture(factureData);
      this.logger.log(`Facture created for reservation ${id}: ${createdFacture._id}`);

      return updatedReservation;
    } catch (error) {
      this.logger.error(`Error completing reservation ${id}: ${error.message}`);
      throw new InternalServerErrorException('Error completing reservation: ' + error.message);
    }
  }

  async promoteFirstWaitingReservation(prestataireId: string, date: Date): Promise<void> {
    this.logger.log(`[DEBUG] Promoting first waiting reservation for prestataire ${prestataireId} around date ${date}`);

    const twoHoursBefore = new Date(date.getTime() - 2 * 60 * 60 * 1000);
    const oneHourAfter = new Date(date.getTime() + 60 * 60 * 1000);

    const waitingReservations = await this.reservationModel
      .find({
        id_prestataire: prestataireId,
        status: 'waiting',
        date: { $gte: twoHoursBefore, $lte: oneHourAfter },
      })
      .populate('id_client', 'email name')
      .sort({ createdAt: 1 })
      .exec();

    if (waitingReservations.length > 0) {
      const firstInLine = waitingReservations[0];
      try {
        const updatedReservation = await this.reservationModel
          .findByIdAndUpdate(
            firstInLine._id,
            { status: 'pending' },
            { new: true }
          )
          .populate('id_client', 'email name')
          .populate('id_prestataire', 'name')
          .exec();

        if (!updatedReservation) {
          this.logger.error(`[DEBUG] Failed to promote reservation ${firstInLine._id} to pending`);
          return;
        }

        this.logger.log(`[DEBUG] Promoted reservation ${firstInLine._id} to pending`);

        const client = updatedReservation.id_client as any;
        const prestataire = updatedReservation.id_prestataire as any;
        const clientEmail = client?.email;
        const reservationDate = new Date(updatedReservation.date).toLocaleString();

        if (clientEmail) {
          const subject = 'Votre Réservation est en Attente de Confirmation';
          const message = `
            Bonjour ${client.name || 'Client'},
            Votre réservation en attente a été promue au statut "en attente de confirmation".
            Détails de la réservation :
            - Service : ${updatedReservation.service || 'N/A'}
            - Prestataire : ${prestataire?.name || 'N/A'}
            - Date : ${reservationDate}
            - Lieu : ${updatedReservation.location || 'N/A'}
            Veuillez attendre la confirmation finale du prestataire.
          `;

          const emailSent = await this.sendEmail(clientEmail, subject, message);
          if (emailSent) {
            this.logger.log(`[DEBUG] Promotion email sent to client ${clientEmail} for reservation ${firstInLine._id}`);
          } else {
            this.logger.warn(`[DEBUG] Failed to send promotion email to client ${clientEmail} for reservation ${firstInLine._id}`);
          }
        } else {
          this.logger.warn(`[DEBUG] No email found for client ${updatedReservation.id_client} in reservation ${firstInLine._id}`);
        }
      } catch (error) {
        this.logger.error(`[ERROR] Failed to promote reservation ${firstInLine._id}: ${error.message}`);
        throw new InternalServerErrorException(`Failed to promote reservation: ${error.message}`);
      }
    } else {
      this.logger.log(`[DEBUG] No waiting reservations found for prestataire ${prestataireId}`);
    }
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

  async sendTomorrowReservationReminders(): Promise<void> {
    this.logger.log('[DEBUG] Checking for confirmed reservations scheduled for tomorrow');

    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const tomorrowEnd = new Date(tomorrow);
      tomorrowEnd.setHours(23, 59, 59, 999);

      const reservations = await this.reservationModel
        .find({
          status: 'confirmed',
          date: { $gte: tomorrow, $lte: tomorrowEnd },
        })
        .populate('id_client', 'email name')
        .populate('id_prestataire', 'email name')
        .exec();

      this.logger.log(`[DEBUG] Found ${reservations.length} confirmed reservations for tomorrow`);

      for (const reservation of reservations) {
        const client = reservation.id_client as any;
        const prestataire = reservation.id_prestataire as any;

        if (!client || !prestataire) {
          this.logger.warn(`[DEBUG] Missing client or prestataire for reservation ${reservation._id}`);
          continue;
        }

        const clientEmail = client.email;
        const prestataireEmail = prestataire.email;
        const reservationDate = new Date(reservation.date).toLocaleString();

        const subject = 'Rappel : Réservation pour demain';
        const clientMessage = `
          Bonjour ${client.name || 'Client'},
          Ceci est un rappel pour votre réservation confirmée prévue demain à ${reservationDate}.
          Service: ${reservation.service || 'N/A'}
          Prestataire: ${prestataire.name || 'N/A'}
          Lieu: ${reservation.location || 'N/A'}
          Merci de vous présenter à l'heure convenue.
        `;
        const prestataireMessage = `
          Bonjour ${prestataire.name || 'Prestataire'},
          Ceci est un rappel pour votre réservation confirmée prévue demain à ${reservationDate}.
          Service: ${reservation.service || 'N/A'}
          Client: ${client.name || 'N/A'}
          Lieu: ${reservation.location || 'N/A'}
          Veuillez vous assurer d'être prêt pour le rendez-vous.
        `;

        if (clientEmail) {
          const clientEmailSent = await this.sendEmail(clientEmail, subject, clientMessage);
          if (clientEmailSent) {
            this.logger.log(`[DEBUG] Reminder email sent to client ${clientEmail} for reservation ${reservation._id}`);
          } else {
            this.logger.warn(`[DEBUG] Failed to send reminder email to client ${clientEmail} for reservation ${reservation._id}`);
          }
        } else {
          this.logger.warn(`[DEBUG] No email found for client ${reservation.id_client} in reservation ${reservation._id}`);
        }

        if (prestataireEmail) {
          const prestataireEmailSent = await this.sendEmail(prestataireEmail, subject, prestataireMessage);
          if (prestataireEmailSent) {
            this.logger.log(`[DEBUG] Reminder email sent to prestataire ${prestataireEmail} for reservation ${reservation._id}`);
          } else {
            this.logger.warn(`[DEBUG] Failed to send reminder email to prestataire ${prestataireEmail} for reservation ${reservation._id}`);
          }
        } else {
          this.logger.warn(`[DEBUG] No email found for prestataire ${reservation.id_prestataire} in reservation ${reservation._id}`);
        }
      }
    } catch (error) {
      this.logger.error(`[ERROR] Failed to send tomorrow's reservation reminders: ${error.message}`);
      throw new InternalServerErrorException('Failed to send reservation reminders');
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async handleDailyReminderTask() {
    this.logger.log('[DEBUG] Running daily reservation reminder task');
    await this.sendTomorrowReservationReminders();
    this.logger.log('[DEBUG] Daily reservation reminder task completed');
  }

  async getDetailedStatistics(): Promise<any> {
    const totalClients = await this.clientModel.countDocuments().exec();
    const totalPrestataires = await this.prestataireModel.countDocuments().exec();
    const totalReservations = await this.reservationModel.countDocuments().exec();
    const totalReservationsByStatus = await this.reservationModel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]).exec();
    const mostActiveClients = await this.reservationModel.aggregate([
      { $group: { _id: '$id_client', count: { $sum: 1 } } },
      { $lookup: { from: 'clients', localField: '_id', foreignField: '_id', as: 'client' } },
      { $unwind: '$client' },
      { $project: { clientName: '$client.name', count: 1 } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]).exec();
    const mostBookedPrestataires = await this.reservationModel.aggregate([
      { $group: { _id: '$id_prestataire', count: { $sum: 1 } } },
      { $lookup: { from: 'prestataires', localField: '_id', foreignField: '_id', as: 'prestataire' } },
      { $unwind: '$prestataire' },
      { $project: { prestataireName: '$prestataire.name', count: 1 } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]).exec();
    const reservationsByCategory = await this.reservationModel.aggregate([
      { $lookup: { from: 'prestataires', localField: 'id_prestataire', foreignField: '_id', as: 'prestataire' } },
      { $unwind: '$prestataire' },
      { $group: { _id: '$prestataire.category', count: { $sum: 1 } } }
    ]).exec();

    return {
      totalClients,
      totalPrestataires,
      totalReservations,
      totalReservationsByStatus: totalReservationsByStatus.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
      mostActiveClients,
      mostBookedPrestataires,
      reservationsByCategory
    };
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
        this.logger.log(`Location update emitted for client ${reservation.id_client} on reservation ${reservationId}`);
      }

      return {
        message,
        location: { lat, lng },
      };
    } catch (error) {
      this.logger.error(`Error in sendLocationCard: ${error.message}`);
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

    const reservation = await this.reservationModel.findById(reservationId).exec();
    if (!reservation) {
      throw new NotFoundException('Réservation non trouvée');
    }
    if (reservation.status !== 'completed') {
      throw new BadRequestException('Seules les réservations terminées peuvent être évaluées');
    }
    if (reservation.isRated) {
      throw new BadRequestException('Cette réservation a déjà été évaluée');
    }

    const prestataire = await this.prestataireModel.findById(prestataireId).exec();
    if (!prestataire) {
      throw new NotFoundException('Prestataire non trouvé');
    }

    const newRatingCount = prestataire.ratingCount + 1;
    const newRating = (prestataire.rating * prestataire.ratingCount + rating) / newRatingCount;

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