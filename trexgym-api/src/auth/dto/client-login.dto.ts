import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

export class ClientLoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{6}$/)
  pin!: string;
}
