import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum PaymentType {
  RENT = 'RENT',
  WATER = 'WATER',
  ELECTRIC = 'ELECTRIC',
  OTHER = 'OTHER',
}

export class CreatePaymentItemDto {
  @IsEnum(PaymentType)
  @IsNotEmpty()
  type: PaymentType;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsNumber()
  @IsOptional()
  electricStartRead?: number;

  @IsNumber()
  @IsOptional()
  electricEndRead?: number;

  @IsNumber()
  @IsOptional()
  electricUsage?: number;

  @IsNumber()
  @IsOptional()
  waterStartRead?: number;

  @IsNumber()
  @IsOptional()
  waterEndRead?: number;

  @IsNumber()
  @IsOptional()
  waterUsage?: number;
}

export class CreatePaymentDto {
  @IsNumber()
  @IsNotEmpty()
  tenantId: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePaymentItemDto)
  items: CreatePaymentItemDto[];

  @IsDateString()
  @IsNotEmpty()
  paidAt: string;

  @IsString()
  @IsOptional()
  remark?: string;

  @IsNumber()
  @IsOptional()
  actualPaid?: number;
}

export class GetUtilityStatsDto {
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  tenantId?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  year?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  month?: number;
}

export class VerifyShareDto {
  @IsString()
  @IsNotEmpty()
  idCardLast6: string;
}
