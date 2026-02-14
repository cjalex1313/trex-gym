import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import {
  CurrencyCode,
  SubscriptionPlanType,
} from '../schemas/subscription.schema';

export class CreateSubscriptionDto {
  @IsEnum(SubscriptionPlanType)
  planType!: SubscriptionPlanType;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  planName?: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsEnum(CurrencyCode)
  currency?: CurrencyCode;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
