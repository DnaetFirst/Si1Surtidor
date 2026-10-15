import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateFuelDto {
  @ApiProperty({ example: 'gasolina', maxLength: 50 })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  tipo!: string;

  @ApiProperty({ example: 95 })
  @Transform(({ value }) => (typeof value === 'string' ? parseInt(value, 10) : value))
  @IsInt()
  @Min(0)
  @Max(200)
  octanaje!: number;

  @ApiProperty({ example: 'Gasolina Premium', maxLength: 100 })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre!: string;

  @ApiPropertyOptional({ maxLength: 255 })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(255)
  descripcion?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  estaActivo?: boolean;
}

export class UpdateFuelDto extends PartialType(CreateFuelDto) {}
