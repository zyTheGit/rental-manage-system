import { IsString, IsNumber, IsOptional, IsDateString, IsNotEmpty } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  idCard: string;

  @IsNumber()
  @IsNotEmpty()
  houseId: number;

  @IsDateString()
  @IsNotEmpty()
  rentStart: string;

  @IsDateString()
  @IsOptional()
  rentEnd?: string;
}

export class UpdateTenantDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  idCard?: string;

  @IsNumber()
  @IsOptional()
  houseId?: number;

  @IsDateString()
  @IsOptional()
  rentStart?: string;

  @IsDateString()
  @IsOptional()
  rentEnd?: string;

  @IsString()
  @IsOptional()
  status?: 'RENTED' | 'CHECKED_OUT';
}
