import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTaskDependencyDto {
  @IsString()
  @IsNotEmpty()
  dependsOnTaskId: string;
}
