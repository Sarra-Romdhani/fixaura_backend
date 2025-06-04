// import { 
//     PipeTransform, 
//     Injectable, 
//     ArgumentMetadata, 
//     HttpStatus,
//     HttpException 
//   } from '@nestjs/common';
//   import { Types } from 'mongoose';
  
//   @Injectable()
//   export class ValidateObjectIdPipe implements PipeTransform<string> {
//     transform(value: string, metadata: ArgumentMetadata) {
//       if (!Types.ObjectId.isValid(value)) {
//         throw new HttpException(
//           'Invalid ID format',
//           HttpStatus.BAD_REQUEST
//         );
//       }
//       return value;
//     }
//   }
// validate-object-id.pipe.ts
// validate-object-id.pipe.ts
import { 
  PipeTransform, 
  Injectable, 
  ArgumentMetadata, 
  BadRequestException 
} from '@nestjs/common';

@Injectable()
export class ValidateObjectIdPipe implements PipeTransform<string> {
  transform(value: string, metadata: ArgumentMetadata): string {
    if (!/^[a-fA-F\d]{24}$/.test(value)) {
      throw new BadRequestException('Invalid ID format');
    }
    return value;
  }
}