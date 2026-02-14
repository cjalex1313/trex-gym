import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  Matches,
  IsString,
  MaxLength,
} from 'class-validator';
import { ClientStatus } from '../schemas/client.schema';

export class CreateClientDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName!: string;

  @IsEmail()
  email!: string;

  @Matches(/^\+?[0-9]{8,15}$/)
  phone!: string;

  @IsOptional()
  @IsEnum(ClientStatus)
  status?: ClientStatus;
}
