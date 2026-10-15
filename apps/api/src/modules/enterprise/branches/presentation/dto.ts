import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';
const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;
export class CreateBranchDto {
    @ApiProperty({ maxLength: 100 }) @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(100)
    nombre!: string;
    @ApiProperty({ maxLength: 255 }) @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(255)
    direccion!: string;
    @ApiProperty({ maxLength: 30 }) @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(30) @Matches(/^[+\d][\d\s().-]{5,29}$/)
    telefono!: string;
    @ApiProperty({ maxLength: 100 }) @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value) @IsEmail() @MaxLength(100)
    correo!: string;
}
export class UpdateBranchDto extends PartialType(CreateBranchDto, { skipNullProperties: false }) {}
