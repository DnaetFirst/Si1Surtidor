import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateDiscountDto {
  @ApiProperty({ description: 'Nombre del descuento', example: 'Descuento Fidelidad' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre!: string;

  @ApiPropertyOptional({ description: 'Descripción detallada', example: 'Aplica a clientes frecuentes' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  descripcion?: string;

  @ApiProperty({ description: 'Tipo de descuento', enum: ['PORCENTAJE', 'MONTO_FIJO'], example: 'PORCENTAJE' })
  @IsEnum(['PORCENTAJE', 'MONTO_FIJO'])
  tipo!: 'PORCENTAJE' | 'MONTO_FIJO';

  @ApiProperty({ description: 'Valor del descuento (% o Bs)', example: 10.0 })
  @IsNumber()
  @Min(0.01)
  valor!: number;

  @ApiPropertyOptional({ description: 'ID de sucursal específica (opcional si es global)', example: 1 })
  @IsOptional()
  @IsNumber()
  idSucursal?: number;

  @ApiPropertyOptional({ description: 'Fecha de inicio de vigencia (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @ApiPropertyOptional({ description: 'Fecha de fin de vigencia (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @ApiPropertyOptional({ description: 'Estado activo del descuento', example: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class UpdateDiscountDto {
  @ApiPropertyOptional({ description: 'Nombre del descuento' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nombre?: string;

  @ApiPropertyOptional({ description: 'Descripción detallada' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  descripcion?: string;

  @ApiPropertyOptional({ description: 'Tipo de descuento', enum: ['PORCENTAJE', 'MONTO_FIJO'] })
  @IsOptional()
  @IsEnum(['PORCENTAJE', 'MONTO_FIJO'])
  tipo?: 'PORCENTAJE' | 'MONTO_FIJO';

  @ApiPropertyOptional({ description: 'Valor del descuento' })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  valor?: number;

  @ApiPropertyOptional({ description: 'Estado activo' })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @ApiPropertyOptional({ description: 'Fecha de inicio de vigencia (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @ApiPropertyOptional({ description: 'Fecha de fin de vigencia (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @ApiPropertyOptional({ description: 'ID de sucursal' })
  @IsOptional()
  @IsNumber()
  idSucursal?: number;
}
