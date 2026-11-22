import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateProductExitDto {
  @ApiProperty({ description: 'Motivo de la salida (merma, vencimiento, uso interno, etc.)', example: 'Producto vencido' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  motivo!: string;

  @ApiProperty({ description: 'Cantidad a dar de baja', example: 5 })
  @IsNumber()
  @Min(0.01)
  cantidad!: number;

  @ApiProperty({ description: 'ID del producto', example: 1 })
  @IsNumber()
  idProducto!: number;

  @ApiPropertyOptional({ description: 'ID del lote específico de donde sale (opcional)', example: 1 })
  @IsOptional()
  @IsNumber()
  idLote?: number;
}
