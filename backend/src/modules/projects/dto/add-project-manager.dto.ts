import {
  IsNotEmpty,
  IsUUID,
} from 'class-validator';

export class AddProjectManagerDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;
}