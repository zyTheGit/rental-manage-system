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

  // 水电表配置
  @IsNumber()
  @IsNotEmpty()
  waterInitialRead: number;

  @IsNumber()
  @IsNotEmpty()
  electricInitialRead: number;

  @IsNumber()
  @IsNotEmpty()
  waterRate: number;

  @IsNumber()
  @IsNotEmpty()
  electricRate: number;
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

  // 水电表配置
  @IsNumber()
  @IsOptional()
  waterInitialRead?: number;

  @IsNumber()
  @IsOptional()
  electricInitialRead?: number;

  @IsNumber()
  @IsOptional()
  waterRate?: number;

  @IsNumber()
  @IsOptional()
  electricRate?: number;
}

export class UpdateHouseStatusDto {
  @IsEnum(HouseStatus)
  status: HouseStatus;
}
