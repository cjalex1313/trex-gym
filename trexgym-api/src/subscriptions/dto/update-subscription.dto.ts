import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import {
  CurrencyCode,
  SubscriptionPlanType,
  SubscriptionStatus,
} from '../schemas/subscription.schema';

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsEnum(SubscriptionPlanType)
  planType?: SubscriptionPlanType;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  planName?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsEnum(CurrencyCode)
  currency?: CurrencyCode;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
