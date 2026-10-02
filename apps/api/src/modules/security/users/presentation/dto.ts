import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, Min, ValidateIf } from 'class-validator';
const trim = ({ value }: {
    value: unknown;
}) => typeof value === 'string' ? value.trim() : value;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,128}$/;
export class CreateUserDto {
    @ApiProperty({ maxLength: 20, description: 'Identificador inmutable del usuario.' })
    @Transform(trim)
    @IsString()
    @Matches(/^[A-Za-z0-9-]{3,20}$/, { message: 'El CI debe contener entre 3 y 20 letras, números o guiones.' })
    ci!: string;
    @ApiProperty({ maxLength: 100 })
    @Transform(trim)
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    nombre!: string;
    @ApiProperty({ maxLength: 100, format: 'email' })
    @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
    @IsEmail()
    @MaxLength(100)
    correo!: string;
    @ApiProperty({ maxLength: 30 })
    @Transform(trim)
    @IsString()
    @IsNotEmpty()
    @MaxLength(30)
    telefono!: string;
    @ApiPropertyOptional({ maxLength: 100 })
    @IsOptional()
    @Transform(trim)
    @IsString()
    @MaxLength(100)
    cargo?: string;
    @ApiProperty({ enum: ['M', 'F', 'O', 'Masculino', 'Femenino', 'Otro', 'No especificado'] })
    @IsString()
    @IsIn(['M', 'F', 'O', 'Masculino', 'Femenino', 'Otro', 'No especificado'])
    sexo!: string;
    @ApiProperty({ maxLength: 255 })
    @Transform(trim)
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    domicilio!: string;
    @ApiProperty({ minLength: 8, maxLength: 128, format: 'password', description: 'Mayúscula, minúscula, número y símbolo. Vacía en PATCH conserva la contraseña.' })
    @IsString()
    @Matches(passwordPattern, { message: 'La contraseña requiere 8–128 caracteres, mayúscula, minúscula, número y símbolo.' })
    contrasena!: string;
    @ApiProperty({ minimum: 1 })
    @IsInt()
    @Min(1)
    rolId!: number;
    @ApiPropertyOptional({ minimum: 1, nullable: true })
    @IsOptional()
    @IsInt()
    @Min(1)
    sucursalId?: number | null;
}
export class UpdateUserDto extends PartialType(CreateUserDto, { skipNullProperties: false }) {
    // An empty password on edit explicitly preserves the existing hash.
    @ValidateIf((_object, value) => value !== undefined && value !== '')
    @IsString()
    @Matches(passwordPattern, { message: 'La contraseña requiere 8–128 caracteres, mayúscula, minúscula, número y símbolo.' })
    declare contrasena?: string;
}
