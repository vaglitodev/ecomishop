import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class RegisterDto {
	@ApiProperty({ example: "user@example.com" })
	@IsEmail()
	@IsNotEmpty()
	email: string;

	@ApiProperty({ example: "password123", minLength: 6 })
	@IsString()
	@IsNotEmpty()
	@MinLength(6)
	password: string;
}

export class LoginDto {
	@ApiProperty({ example: "user@example.com" })
	@IsEmail()
	@IsNotEmpty()
	email: string;

	@ApiProperty({ example: "password123" })
	@IsString()
	@IsNotEmpty()
	password: string;
}

export class ForgotPasswordDto {
	@ApiProperty({ example: "user@example.com" })
	@IsEmail()
	@IsNotEmpty()
	email: string;
}

export class ResetPasswordDto {
	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	token: string;

	@ApiProperty({ minLength: 6 })
	@IsString()
	@IsNotEmpty()
	@MinLength(6)
	password: string;
}

export class RefreshTokenDto {
	@ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
	@IsString()
	@IsNotEmpty()
	refreshToken: string;
}

export class ChangePasswordDto {
	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	oldPassword: string;

	@ApiProperty({ minLength: 6 })
	@IsString()
	@IsNotEmpty()
	@MinLength(6)
	newPassword: string;
}
