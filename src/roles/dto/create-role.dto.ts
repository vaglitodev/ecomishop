import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
    @ApiProperty({ example: 'manager' })
    @IsString()
    @IsNotEmpty()
    name: string;
}

export class AssignRoleDto {
    @ApiProperty({ example: 1 })
    @IsNotEmpty()
    userId: number;

    @ApiProperty({ example: 'admin' })
    @IsString()
    @IsNotEmpty()
    roleName: string;
}
