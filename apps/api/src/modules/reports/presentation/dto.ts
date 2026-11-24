import { IsBase64, IsBoolean, IsIn, IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class TranscribeReportVoiceDto {
  @IsBase64()
  @MinLength(4)
  @MaxLength(96000)
  data!: string;

  @IsIn(['audio/webm', 'audio/ogg', 'audio/m4a'])
  mimeType!: string;
}

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
