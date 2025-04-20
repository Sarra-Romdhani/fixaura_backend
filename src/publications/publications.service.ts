// import { Injectable, BadRequestException, NotFoundException, Put } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model, Types } from 'mongoose';
// import { Publication } from './publication.schema';
// import path, { join } from 'path';
// import * as fs from 'fs';


// @Injectable()
// export class PublicationsService {
//   constructor( 
//     @InjectModel(Publication.name) private publicationModel: Model<Publication>,
//   ) {}

//   // Créer une nouvelle publication
//   // async create(data: any): Promise<Publication> {
//   //   // Validation manuelle
//   //   if (!data.title || typeof data.title !== 'string') {
//   //     throw new BadRequestException('Title is required and must be a string');
//   //   }
//   //   if (!data.description || typeof data.description !== 'string') {
//   //     throw new BadRequestException('Description is required and must be a string');
//   //   }
//   //   if (!data.providerId || typeof data.providerId !== 'string') {
//   //     throw new BadRequestException('ProviderId is required and must be a string');
//   //   }
//   //   // Picture est optionnel, mais on vérifie que c'est une string si elle est fournie
//   //   if (data.picture && typeof data.picture !== 'string') {
//   //     throw new BadRequestException('Picture must be a string if provided');
//   //   }

//   //   const newPublication = new this.publicationModel({
//   //     title: data.title,
//   //     description: data.description,
//   //     picture: data.picture || '', // Si picture n'est pas fourni, on met une chaîne vide
//   //     providerId: data.providerId,
//   //   });

//   //   return newPublication.save();
//   // }
//   // async create(createDto: {
//   //   title: string;
//   //   description: string;
//   //   providerId: string;
//   //   picture: string;
//   // }): Promise<Publication> {
//   //   const publication = new this.publicationModel(createDto);
//   //   return publication.save();
//   // }
//   async create(createDto: {
//     title: string;
//     description: string;
//     providerId: string;
//     picture: string;
//   }) {
//     if (!createDto.title) throw new BadRequestException('Title is required');
//     if (!createDto.description) throw new BadRequestException('Description is required');
//     if (!createDto.providerId) throw new BadRequestException('ProviderId is required');

//     const publication = new this.publicationModel({
//       ...createDto,
//       likes: [],
//       comments: [],
//     });
//     return publication.save();
//   }

//   async updatePublication(
//     id: string,
//     updateData: {
//       title: string;
//       description: string;
//       providerId: string;
//       picture: string;
//     },
//   ) {
//     if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid publication ID');
//     const publication = await this.publicationModel.findByIdAndUpdate(
//       id,
//       { ...updateData },
//       { new: true },
//     );
//     if (!publication) throw new NotFoundException('Publication not found');
//     return publication;
//   }

//   async remove(id: string): Promise<void> {
//     if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid publication ID');
//     const result = await this.publicationModel.findByIdAndDelete(id).exec();
//     if (!result) throw new NotFoundException(`Publication with ID ${id} not found`);
//   }
//   // Récupérer toutes les publications
//   async findAll(): Promise<Publication[]> {
//     return this.publicationModel.find().exec();
//   }

//   // Récupérer une publication par ID
//   async findOne(id: string): Promise<Publication> {
//     if (!id || typeof id !== 'string') {
//       throw new BadRequestException('ID must be a valid string');
//     }
//     const publication = await this.publicationModel.findById(id).exec();
//     if (!publication) {
//       throw new NotFoundException(`Publication with ID ${id} not found`);
//     }
//     return publication;
//   }

//   // Mettre à jour une publication
//   // async updatePublication(id: string, updateData: any) {
//   //   return this.publicationModel.findByIdAndUpdate(id, updateData, { new: true });
//   // }

 
  

  

//   // Supprimer une publication
//   // async remove(id: string): Promise<void> {
//   //   if (!id || typeof id !== 'string') {
//   //     throw new BadRequestException('ID must be a valid string');
//   //   }
//   //   const result = await this.publicationModel.findByIdAndDelete(id).exec();
//   //   if (!result) {
//   //     throw new NotFoundException(`Publication with ID ${id} not found`);
//   //   }
//   // }

 

//   async findByPrestataireId(prestataireId: string): Promise<Publication[]> {
//     // Validate the prestataireId format
//     if (!Types.ObjectId.isValid(prestataireId)) {
//       throw new BadRequestException('Invalid prestataire ID format');
//     }

//     // Find all publications for this prestataire
//     const publications = await this.publicationModel.find({ 
//       providerId: prestataireId 
//     }).exec();
    
//     return publications;
//   }
























//   // Ajouter ces nouvelles méthodes
//   async toggleLike(publicationId: string, userId: string) {
//     const publication = await this.publicationModel.findById(publicationId);
//     if (!publication) throw new NotFoundException('Publication not found');
  
//     const likes = publication.likes || [];
//     const index = likes.indexOf(userId);
//     if (index === -1) {
//       likes.push(userId); // Like
//     } else {
//       likes.splice(index, 1); // Unlike
//     }
//     publication.likes = likes;
//     await publication.save();
  
//     return { message: 'Like toggled successfully', likes: publication.likes };
//   }

//   async addComment(publicationId: string, userId: string, text: string) {
//     if (!Types.ObjectId.isValid(publicationId)) {
//       throw new BadRequestException('Invalid publication ID format');
//     }
//     const publication = await this.publicationModel.findById(publicationId);
//     if (!publication) throw new NotFoundException('Publication not found');
  
//     const newComment = {
//       userId,
//       text,
//       createdAt: new Date(),
//     };
//     publication.comments.push(newComment);
//     await publication.save();
  
//     // Return the updated publication with comments
//     return this.publicationModel.findById(publicationId).exec();
//   }



//   async updateComment(publicationId: string, commentId: string, newText: string) {
//     if (!Types.ObjectId.isValid(publicationId) || !Types.ObjectId.isValid(commentId)) {
//       throw new BadRequestException('Invalid ID format');
//     }
  
//     const publication = await this.publicationModel.findById(publicationId);
//     if (!publication) {
//       throw new NotFoundException('Publication not found');
//     }
  
//     const comment = publication.comments.find(
//       (c: any) => c._id.toString() === commentId
//     );
  
//     if (!comment) {
//       throw new NotFoundException('Comment not found');
//     }
  
//     comment.text = newText;
//     await publication.save();
//     return comment;
//   }
  
//   async deleteComment(publicationId: string, commentId: string) {
//     if (!Types.ObjectId.isValid(publicationId) || !Types.ObjectId.isValid(commentId)) {
//       throw new BadRequestException('Invalid ID format');
//     }
  
//     const publication = await this.publicationModel.findById(publicationId);
//     if (!publication) {
//       throw new NotFoundException('Publication not found');
//     }
  
//     const initialLength = publication.comments.length;
//     publication.comments = publication.comments.filter(
//       (c: any) => c._id.toString() !== commentId
//     );
  
//     if (publication.comments.length === initialLength) {
//       throw new NotFoundException('Comment not found');
//     }
  
//     await publication.save();
//     return { message: 'Comment deleted successfully' };
//   }
  

// }



import { Injectable, BadRequestException, NotFoundException, Put } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Publication } from './publication.schema';
import path, { join } from 'path';
import * as fs from 'fs';


@Injectable()
export class PublicationsService {
  constructor( 
    @InjectModel(Publication.name) private publicationModel: Model<Publication>,
  ) {}

  // Créer une nouvelle publication
  // async create(data: any): Promise<Publication> {
  //   // Validation manuelle
  //   if (!data.title || typeof data.title !== 'string') {
  //     throw new BadRequestException('Title is required and must be a string');
  //   }
  //   if (!data.description || typeof data.description !== 'string') {
  //     throw new BadRequestException('Description is required and must be a string');
  //   }
  //   if (!data.providerId || typeof data.providerId !== 'string') {
  //     throw new BadRequestException('ProviderId is required and must be a string');
  //   }
  //   // Picture est optionnel, mais on vérifie que c'est une string si elle est fournie
  //   if (data.picture && typeof data.picture !== 'string') {
  //     throw new BadRequestException('Picture must be a string if provided');
  //   }

  //   const newPublication = new this.publicationModel({
  //     title: data.title,
  //     description: data.description,
  //     picture: data.picture || '', // Si picture n'est pas fourni, on met une chaîne vide
  //     providerId: data.providerId,
  //   });

  //   return newPublication.save();
  // }
  // async create(createDto: {
  //   title: string;
  //   description: string;
  //   providerId: string;
  //   picture: string;
  // }): Promise<Publication> {
  //   const publication = new this.publicationModel(createDto);
  //   return publication.save();
  // }
  async create(createDto: {
    title: string;
    description: string;
    providerId: string;
    picture?: string;
  }): Promise<Publication> {
    if (!createDto.title) throw new BadRequestException('Title is required');
    if (!createDto.description) throw new BadRequestException('Description is required');
    if (!createDto.providerId) throw new BadRequestException('ProviderId is required');

    const publication = new this.publicationModel({
      ...createDto,
      likes: [],
      comments: [],
    });
    return publication.save();
  }

// publications.service.ts
// publications.service.ts
async updatePublication(id: string, updateData: any) {
  if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid publication ID');
  const publication = await this.publicationModel.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true }
  );
  if (!publication) throw new NotFoundException('Publication not found');
  return publication;
}
  // Récupérer toutes les publications
  async findAll(): Promise<Publication[]> {
    return this.publicationModel.find().exec();
  }

  // Récupérer une publication par ID
  async findOne(id: string): Promise<Publication> {
    if (!id || typeof id !== 'string') {
      throw new BadRequestException('ID must be a valid string');
    }
    const publication = await this.publicationModel.findById(id).exec();
    if (!publication) {
      throw new NotFoundException(`Publication with ID ${id} not found`);
    }
    return publication;
  }

  // Mettre à jour une publication
  // async updatePublication(id: string, updateData: any) {
  //   return this.publicationModel.findByIdAndUpdate(id, updateData, { new: true });
  // }

 
  

  

  // Supprimer une publication
  async remove(id: string): Promise<void> {
    if (!id || typeof id !== 'string') {
      throw new BadRequestException('ID must be a valid string');
    }
    const result = await this.publicationModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Publication with ID ${id} not found`);
    }
  }

 

  async findByPrestataireId(prestataireId: string): Promise<Publication[]> {
    // Validate the prestataireId format
    if (!Types.ObjectId.isValid(prestataireId)) {
      throw new BadRequestException('Invalid prestataire ID format');
    }

    // Find all publications for this prestataire
    const publications = await this.publicationModel.find({ 
      providerId: prestataireId 
    }).exec();
    
    return publications;
  }
























  // Ajouter ces nouvelles méthodes
  async toggleLike(publicationId: string, userId: string) {
    const publication = await this.publicationModel.findById(publicationId);
    if (!publication) throw new NotFoundException('Publication not found');
  
    const likes = publication.likes || [];
    const index = likes.indexOf(userId);
    if (index === -1) {
      likes.push(userId); // Like
    } else {
      likes.splice(index, 1); // Unlike
    }
    publication.likes = likes;
    await publication.save();
  
    return { message: 'Like toggled successfully', likes: publication.likes };
  }

  async addComment(publicationId: string, userId: string, text: string) {
    if (!Types.ObjectId.isValid(publicationId)) {
      throw new BadRequestException('Invalid publication ID format');
    }
    const publication = await this.publicationModel.findById(publicationId);
    if (!publication) throw new NotFoundException('Publication not found');
  
    const newComment = {
      userId,
      text,
      createdAt: new Date(),
    };
    publication.comments.push(newComment);
    await publication.save();
  
    // Return the updated publication with comments
    return this.publicationModel.findById(publicationId).exec();
  }



  async updateComment(publicationId: string, commentId: string, newText: string) {
    if (!Types.ObjectId.isValid(publicationId) || !Types.ObjectId.isValid(commentId)) {
      throw new BadRequestException('Invalid ID format');
    }
  
    const publication = await this.publicationModel.findById(publicationId);
    if (!publication) {
      throw new NotFoundException('Publication not found');
    }
  
    const comment = publication.comments.find(
      (c: any) => c._id.toString() === commentId
    );
  
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
  
    comment.text = newText;
    await publication.save();
    return comment;
  }
  
  async deleteComment(publicationId: string, commentId: string) {
    if (!Types.ObjectId.isValid(publicationId) || !Types.ObjectId.isValid(commentId)) {
      throw new BadRequestException('Invalid ID format');
    }
  
    const publication = await this.publicationModel.findById(publicationId);
    if (!publication) {
      throw new NotFoundException('Publication not found');
    }
  
    const initialLength = publication.comments.length;
    publication.comments = publication.comments.filter(
      (c: any) => c._id.toString() !== commentId
    );
  
    if (publication.comments.length === initialLength) {
      throw new NotFoundException('Comment not found');
    }
  
    await publication.save();
    return { message: 'Comment deleted successfully' };
  }


}