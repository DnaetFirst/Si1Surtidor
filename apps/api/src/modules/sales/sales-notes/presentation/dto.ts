import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min, ValidateNested } from 'class-validator';

export class CreateSaleItemDto {
  @ApiPropertyOptional({ description: 'ID del producto de tienda (opcional si es combustible)', example: 1 })
  @IsOptional()
  @IsNumber()
  idProducto?: number;

  @ApiPropertyOptional({ description: 'ID de la manguera del dispensador (opcional si es producto)', example: 1 })
  @IsOptional()
  @IsNumber()
  idManguera?: number;

  @ApiPropertyOptional({ description: 'ID del dispensador', example: 1 })
  @IsOptional()
  @IsNumber()
  idDispensador?: number;

  @ApiPropertyOptional({ description: 'Tipo de ítem (COMBUSTIBLE o TIENDA)', example: 'COMBUSTIBLE' })
  @IsOptional()
  @IsString()
  tipo?: string;

  @ApiPropertyOptional({ description: 'Nombre descriptivo del ítem', example: 'Gasolina' })
  @IsOptional()
  @IsString()
  nombreItem?: string;

  @ApiPropertyOptional({ description: 'ID del descuento aplicado', example: 1 })
  @IsOptional()
  @IsNumber()
  idDescuento?: number;

  @ApiProperty({ description: 'Cantidad vendida (litros o unidades)', example: 20.5 })
  @IsNumber()
  @Min(0.001)
  cantidad!: number;

  @ApiProperty({ description: 'Precio unitario cobrado', example: 3.74 })
  @IsNumber()
  @Min(0)
  precio!: number;
}

export class CreateSaleDto {
  @ApiPropertyOptional({ description: 'Código único de venta', example: 'NV-000001' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  codigo?: string;

  @ApiPropertyOptional({ description: 'Nombre o razón social del cliente', example: 'Juan Pérez' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nombreCliente?: string;

  @ApiPropertyOptional({ description: 'NIT o CI del cliente', example: '4938291012' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  nit?: string;

  @ApiPropertyOptional({ description: 'Placa del vehículo', example: '3849-XYZ' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  placa?: string;

  @ApiProperty({ description: 'Método de pago', example: 'EFECTIVO' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  metodoPago!: string;

  @ApiProperty({ description: 'Monto entregado por el cliente', example: 100.00 })
  @IsNumber()
  @Min(0)
  montoPagado!: number;

  @ApiPropertyOptional({ description: 'Validación B-SISA habilitada', example: true, default: true })
  @IsOptional()
  @IsBoolean()
  estadoBSisa?: boolean;

  @ApiPropertyOptional({ description: 'ID del dispensador utilizado', example: 1 })
  @IsOptional()
  @IsNumber()
  idDispensador?: number;

  @ApiProperty({ description: 'ID de la sucursal de la venta', example: 1 })
  @IsNumber()
  idSucursal!: number;

  @ApiProperty({ description: 'Ítems de la venta', type: [CreateSaleItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  detalles!: CreateSaleItemDto[];
}
