
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