import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min, ValidateNested } from 'class-validator';

export class CreatePurchaseReceiptItemDto {
  @ApiProperty({ description: 'ID del producto comprado', example: 1 })
  @IsNumber()
  idProducto!: number;

  @ApiProperty({ description: 'Cantidad recibida', example: 100 })
  @IsNumber()
  @Min(0.01)
  cantidad!: number;

  @ApiProperty({ description: 'Precio unitario de compra', example: 25.50 })
  @IsNumber()
  @Min(0)
  precio!: number;

  @ApiPropertyOptional({ description: 'Código del lote', example: 'LOTE-2024-001' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  loteCodigo?: string;

  @ApiPropertyOptional({ description: 'Fecha de vencimiento (YYYY-MM-DD)', example: '2025-12-31' })
  @IsOptional()
  @IsString()
  fechaVencimiento?: string;

  @ApiPropertyOptional({ description: 'Observación del lote', example: 'Entrega en tambores sellados' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  loteDetalle?: string;
}

export class CreatePurchaseReceiptDto {
  @ApiPropertyOptional({ description: 'Código de nota de compra (generado automáticamente si se omite)', example: 'NC-00001' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  codigo?: string;

  @ApiPropertyOptional({ description: 'Motivo o glosa de la compra', example: 'Factura F-9938' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  motivo?: string;

  @ApiPropertyOptional({ description: 'Moneda utilizada', example: 'BOB', default: 'BOB' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  moneda?: string;

  @ApiPropertyOptional({ description: 'ID del proveedor', example: 1 })
  @IsOptional()
  @IsNumber()
  idProveedor?: number;

  @ApiPropertyOptional({ description: 'ID de la sucursal que recibe', example: 1 })
  @IsOptional()
  @IsNumber()
  idSucursal?: number;

  @ApiPropertyOptional({ description: 'ID de la orden de compra vinculada (opcional)', example: 1 })
  @IsOptional()
  @IsNumber()
  idOrden?: number;

  @ApiProperty({ description: 'Detalle de productos comprados', type: [CreatePurchaseReceiptItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseReceiptItemDto)
  detalles!: CreatePurchaseReceiptItemDto[];
}

export class UpdatePurchaseReceiptDto {
  @ApiPropertyOptional({ description: 'Motivo o glosa actualizada de la compra' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  motivo?: string;

  @ApiPropertyOptional({ description: 'Moneda utilizada' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  moneda?: string;
}
