import { IsBoolean, IsInt, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReminderDto {
  @IsInt()
  @Min(1)
  @Max(28)
  reminderDay: number;

  @IsInt()
  @Min(1)
  @Max(28)
  dueDay: number;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean = true;

  @IsBoolean()
  @IsOptional()
  notifyByEmail?: boolean = false;

  @IsBoolean()
  @IsOptional()
  notifyBySms?: boolean = false;
}

export class UpdateReminderDto {
  @IsInt()
  @Min(1)
  @Max(28)
  @IsOptional()
  reminderDay?: number;

  @IsInt()
  @Min(1)
  @Max(28)
  @IsOptional()
  dueDay?: number;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsBoolean()
  @IsOptional()
  notifyByEmail?: boolean;

  @IsBoolean()
  @IsOptional()
  notifyBySms?: boolean;
}
