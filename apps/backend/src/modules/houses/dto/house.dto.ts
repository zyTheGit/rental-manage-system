import { IsString, IsNumber, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';

export enum HouseStatus {
  AVAILABLE = 'AVAILABLE',
  RENTED = 'RENTED',
}

export class CreateHouseDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsNumber()
  @IsNotEmpty()
  rent: number;

  @IsNumber()
  @IsOptional()
  deposit?: number;

  @IsNumber()
  @IsOptional()
  area?: number;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateHouseDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsNumber()
  @IsOptional()
  rent?: number;

  @IsNumber()
  @IsOptional()
  deposit?: number;

  @IsNumber()
  @IsOptional()
  area?: number;

  @IsEnum(HouseStatus)
  @IsOptional()
  status?: HouseStatus;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateHouseStatusDto {
  @IsEnum(HouseStatus)
  status: HouseStatus;
}
