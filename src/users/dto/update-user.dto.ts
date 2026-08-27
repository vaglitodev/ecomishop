import { IsBoolean, IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @IsOptional()
  @IsString()
  verificationToken?: string | null;

  @IsOptional()
  @IsString()
  resetPasswordToken?: string | null;

  @IsOptional()
  @IsDateString()
  resetPasswordExpires?: string | null;
}
