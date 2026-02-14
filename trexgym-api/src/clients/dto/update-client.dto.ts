import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { ClientStatus } from '../schemas/client.schema';

export class UpdateClientDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @Matches(/^\+?[0-9]{8,15}$/)
  phone?: string;

  @IsOptional()
  @IsEnum(ClientStatus)
  status?: ClientStatus;
}
