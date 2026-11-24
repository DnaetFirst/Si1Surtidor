import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class ConsultReportAiDto {
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  prompt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  tipo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  desde?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  hasta?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  periodo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sucursalId?: number;

  @IsOptional()
  @IsBoolean()
  viaVoz?: boolean;
}
