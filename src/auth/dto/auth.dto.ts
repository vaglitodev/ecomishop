import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from "class-validator";

export class RegisterDto {
	@ApiProperty({ example: "user@example.com" })
	@IsEmail()
	@IsNotEmpty()
	email: string;

	@ApiProperty({ example: "Password1!", minLength: 8 })
	@IsString()
	@IsNotEmpty()
	@MinLength(8)
	@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
		message: "Password must contain at least one uppercase letter, one lowercase letter, and one number",
	})
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

	@ApiProperty({ minLength: 8 })
	@IsString()
	@IsNotEmpty()
	@MinLength(8)
	@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
		message: "Password must contain at least one uppercase letter, one lowercase letter, and one number",
	})
	password: string;
}

export class ChangePasswordDto {
	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	oldPassword: string;

	@ApiProperty({ minLength: 8 })
	@IsString()
	@IsNotEmpty()
	@MinLength(8)
	@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
		message: "Password must contain at least one uppercase letter, one lowercase letter, and one number",
	})
	newPassword: string;
}
