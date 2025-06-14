import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Publication } from './publication.schema';

@Injectable()
export class PublicationsService {
  constructor(
    @InjectModel(Publication.name) private publicationModel: Model<Publication>,
  ) {}

  async create(createDto: {
    title: string;
    description: string;
    providerId: string;
    pictures?: string[];
  }): Promise<Publication> {
    if (!createDto.title) throw new BadRequestException('Title is required');
    if (!createDto.description) throw new BadRequestException('Description is required');
    if (!createDto.providerId) throw new BadRequestException('ProviderId is required');

    const publication = new this.publicationModel({
      ...createDto,
      pictures: createDto.pictures || [],
      likes: [],
      comments: [],
    });
    return publication.save();
  }

  async updatePublication(id: string, updateData: Partial<Publication>): Promise<Publication> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid publication ID');
    }

    const updatedPublication = await this.publicationModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true })
      .exec();

    if (!updatedPublication) {
      throw new NotFoundException('Publication not found');
    }

    return updatedPublication;
  }

  async findById(id: string): Promise<Publication> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid publication ID');
    }
    const publication = await this.publicationModel.findById(id).exec();
    if (!publication) {
      throw new NotFoundException(`Publication with ID ${id} not found`);
    }
    return publication;
  }

  async findAll(): Promise<Publication[]> {
    return this.publicationModel.find().exec();
  }

  async findOne(id: string): Promise<Publication> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid publication ID');
    }
    const publication = await this.publicationModel.findById(id).exec();
    if (!publication) {
      throw new NotFoundException(`Publication with ID ${id} not found`);
    }
    return publication;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid publication ID');
    }
    const result = await this.publicationModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Publication with ID ${id} not found`);
    }
  }

  async findByPrestataireId(prestataireId: string): Promise<Publication[]> {
    if (!Types.ObjectId.isValid(prestataireId)) {
      throw new BadRequestException('Invalid prestataire ID format');
    }

    const publications = await this.publicationModel.find({ 
      providerId: prestataireId 
    }).exec();
    
    return publications;
  }

  async toggleLike(publicationId: string, userId: string) {
    const publication = await this.publicationModel.findById(publicationId);
    if (!publication) throw new NotFoundException('Publication not found');
  
    const likes = publication.likes || [];
    const index = likes.indexOf(userId);
    if (index === -1) {
      likes.push(userId);
    } else {
      likes.splice(index, 1);
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
  
    const comment = publication.comments.find(
      (c: any) => c._id.toString() === commentId
    );
  
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    publication.comments = publication.comments.filter(
      (c: any) => c._id.toString() !== commentId
    );
  
    await publication.save();
    return { message: 'Comment deleted successfully' };
  }
}






























// import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model, Types } from 'mongoose';
// import { Publication } from './publication.schema';

// @Injectable()
// export class PublicationsService {
//   constructor(
//     @InjectModel(Publication.name) private publicationModel: Model<Publication>,
//   ) {}

//  async create(createPublicationDto: any): Promise<Publication> {
//     const createdPublication = new this.publicationModel(createPublicationDto);
//     return createdPublication.save();
//   }

//   async findByProvider(providerId: string): Promise<Publication[]> {
//     try {
//       const publications = await this.publicationModel.find({ providerId }).exec();
//       console.log(`Found ${publications.length} publications for providerId: ${providerId}`);
//       return publications;
//     } catch (error) {
//       console.error('Error finding publications:', error);
//       throw new Error(`Failed to find publications: ${error.message}`);
//     }
//   }

//   async updatePublication(id: string, updateData: Partial<Publication>): Promise<Publication> {
//     if (!Types.ObjectId.isValid(id)) {
//       throw new BadRequestException('Invalid publication ID');
//     }

//     console.log('MongoDB update query:', { id, updateData });

//     const updatedPublication = await this.publicationModel
//       .findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true })
//       .exec();

//     if (!updatedPublication) {
//       throw new NotFoundException('Publication not found');
//     }

//     console.log('MongoDB update result:', updatedPublication);

//     return updatedPublication;
//   }

//   async findById(id: string): Promise<Publication> {
//     if (!Types.ObjectId.isValid(id)) {
//       throw new BadRequestException('Invalid publication ID');
//     }
//     const publication = await this.publicationModel.findById(id).exec();
//     if (!publication) {
//       throw new NotFoundException(`Publication with ID ${id} not found`);
//     }
//     return publication;
//   }

//   async findAll(): Promise<Publication[]> {
//     return this.publicationModel.find().exec();
//   }

//   async findOne(id: string): Promise<Publication> {
//     if (!Types.ObjectId.isValid(id)) {
//       throw new BadRequestException('Invalid publication ID');
//     }
//     const publication = await this.publicationModel.findById(id).exec();
//     if (!publication) {
//       throw new NotFoundException(`Publication with ID ${id} not found`);
//     }
//     return publication;
//   }

//   async remove(id: string): Promise<void> {
//     if (!Types.ObjectId.isValid(id)) {
//       throw new BadRequestException('Invalid publication ID');
//     }
//     const result = await this.publicationModel.findByIdAndDelete(id).exec();
//     if (!result) {
//       throw new NotFoundException(`Publication with ID ${id} not found`);
//     }
//   }

//   async findByPrestataireId(prestataireId: string): Promise<Publication[]> {
//     if (!Types.ObjectId.isValid(prestataireId)) {
//       throw new BadRequestException('Invalid prestataire ID format');
//     }

//     return this.publicationModel.find({ providerId: prestataireId }).exec();
//   }

//   async toggleLike(publicationId: string, userId: string) {
//     const publication = await this.publicationModel.findById(publicationId);
//     if (!publication) throw new NotFoundException('Publication not found');

//     const likes = publication.likes || [];
//     const index = likes.indexOf(userId);
//     if (index === -1) {
//       likes.push(userId);
//     } else {
//       likes.splice(index, 1);
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