import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min, ValidateNested } from 'class-validator';

export class CreatePurchaseOrderItemDto {
  @ApiProperty({ description: 'ID del producto a comprar', example: 1 })
  @IsNumber()
  idProducto!: number;

  @ApiProperty({ description: 'Cantidad solicitada', example: 50 })
  @IsNumber()
  @Min(0.01)
  cantidad!: number;
}

export class CreatePurchaseOrderDto {
  @ApiPropertyOptional({ description: 'Código único de la orden (generado automáticamente si se omite)', example: 'OC-00001' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  codigo?: string;

  @ApiPropertyOptional({ description: 'Motivo u observación de la compra', example: 'Reposición semanal de lubricantes' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  motivo?: string;

  @ApiPropertyOptional({ description: 'ID del proveedor sugerido', example: 1 })
  @IsOptional()
  @IsNumber()
  idProveedor?: number;

  @ApiProperty({ description: 'ID de la sucursal solicitante', example: 1 })
  @IsNumber()
  idSucursal!: number;

  @ApiProperty({ description: 'Lista de productos solicitados', type: [CreatePurchaseOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderItemDto)
  detalles!: CreatePurchaseOrderItemDto[];
}

export class UpdatePurchaseOrderDto {
  @ApiPropertyOptional({ description: 'Motivo u observación de la compra' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  motivo?: string;

  @ApiPropertyOptional({ description: 'ID del proveedor sugerido' })
  @IsOptional()
  @IsNumber()
  idProveedor?: number;

  @ApiPropertyOptional({ description: 'ID de la sucursal solicitante' })
  @IsOptional()
  @IsNumber()
  idSucursal?: number;

  @ApiPropertyOptional({ description: 'Lista actualizada de productos', type: [CreatePurchaseOrderItemDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderItemDto)
  detalles?: CreatePurchaseOrderItemDto[];
}

export class UpdatePurchaseOrderStatusDto {
  @ApiProperty({ description: 'Nuevo estado de la orden', enum: ['PENDIENTE', 'APROBADA', 'RECIBIDA', 'ANULADA'], example: 'APROBADA' })
  @IsEnum(['PENDIENTE', 'APROBADA', 'RECIBIDA', 'ANULADA'])
  @IsNotEmpty()
  estado!: 'PENDIENTE' | 'APROBADA' | 'RECIBIDA' | 'ANULADA';

  @ApiPropertyOptional({ description: 'Motivo de anulación o cambio de estado' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  motivo?: string;
}
