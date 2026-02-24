import { IsString, IsNumber, IsOptional, IsDateString, IsEnum, IsNotEmpty } from 'class-validator';

export enum PaymentType {
  RENT = 'RENT',
  WATER = 'WATER',
  ELECTRIC = 'ELECTRIC',
  OTHER = 'OTHER',
}

export class CreatePaymentDto {
  @IsNumber()
  @IsNotEmpty()
  tenantId: number;

  @IsEnum(PaymentType)
  @IsNotEmpty()
  type: PaymentType;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsDateString()
  @IsNotEmpty()
  paidAt: string;

  @IsString()
  @IsOptional()
  remark?: string;
}
