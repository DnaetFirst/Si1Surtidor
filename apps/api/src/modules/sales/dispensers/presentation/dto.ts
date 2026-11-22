import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;

export class CreateDispenserDto {
  @ApiProperty({ maxLength: 100 })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  ubicacion!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  capacidadMaxima!: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  idSucursal!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  estaActivo?: boolean;

  @ApiPropertyOptional({ maxLength: 20 })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(20)
  estado?: string;
}

export class UpdateDispenserDto {
  @ApiPropertyOptional({ maxLength: 100 })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  ubicacion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  capacidadMaxima?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  idSucursal?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  estaActivo?: boolean;

  @ApiPropertyOptional({ maxLength: 20 })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(20)
  estado?: string;
}

export class CreateHoseDto {
  @ApiPropertyOptional({ maxLength: 100 })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nombre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  numero?: number;

  @ApiPropertyOptional({ maxLength: 10 })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(10)
  lado?: string;

  @ApiPropertyOptional({ maxLength: 30 })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(30)
  color?: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  idCombustible!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  estaActivo?: boolean;

  @ApiPropertyOptional({ maxLength: 20 })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(20)
  estado?: string;
}

export class UpdateHoseDto {
  @ApiPropertyOptional({ maxLength: 100 })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nombre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  numero?: number;

  @ApiPropertyOptional({ maxLength: 10 })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(10)
  lado?: string;

  @ApiPropertyOptional({ maxLength: 30 })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(30)
  color?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  idCombustible?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  estaActivo?: boolean;

  @ApiPropertyOptional({ maxLength: 20 })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(20)
  estado?: string;
}
