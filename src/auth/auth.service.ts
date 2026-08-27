import {
	BadRequestException,
	Injectable,
	NotFoundException,
	UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { Repository } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import type { MailerService } from "../mailer/mailer.service";
import type { UsersService } from "../users/users.service";
import type {
	ChangePasswordDto,
	ForgotPasswordDto,
	LoginDto,
	RegisterDto,
	ResetPasswordDto,
} from "./dto/auth.dto";
import { RefreshToken } from "./entities/refresh-token.entity";

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

@Injectable()
export class AuthService {
	constructor(
		private usersService: UsersService,
		private jwtService: JwtService,
		private mailerService: MailerService,
		@InjectRepository(RefreshToken)
		private refreshTokenRepository: Repository<RefreshToken>,
	) {}

	async register(registerDto: RegisterDto) {
		const existingUser = await this.usersService.findOneByEmail(
			registerDto.email,
		);
		if (existingUser) {
			throw new BadRequestException("El usuario ya existe");
		}

		const hashedPassword = await bcrypt.hash(registerDto.password, 10);
		const verificationToken = uuidv4();

		const user = await this.usersService.create({
			email: registerDto.email,
			password: hashedPassword,
			verificationToken,
		});

		await this.mailerService.sendVerificationEmail(
			user.email,
			verificationToken,
		);

		return {
			message: "Registro exitoso. Revisa tu correo para verificar tu cuenta.",
		};
	}

	async login(loginDto: LoginDto) {
		const user = await this.usersService.findOneByEmail(loginDto.email);
		if (!user) {
			throw new UnauthorizedException("Credenciales inválidas");
		}

		const isMatch = await bcrypt.compare(loginDto.password, user.password);
		if (!isMatch) {
			throw new UnauthorizedException("Credenciales inválidas");
		}

		if (!user.isVerified) {
			throw new UnauthorizedException(
				"Por favor verifica tu correo electrónico",
			);
		}

		const payload = {
			email: user.email,
			sub: user.id,
			roles: user.roles ? user.roles.map((r) => r.name) : [],
		};

		// Generate refresh token (opaque UUID, store bcrypt hash)
		const refreshTokenValue = uuidv4();
		const refreshTokenHash = await bcrypt.hash(refreshTokenValue, 10);

		await this.refreshTokenRepository.save({
			token: refreshTokenHash,
			userId: user.id,
			expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
		});

		return {
			user,
			access_token: this.jwtService.sign(payload),
			refresh_token: refreshTokenValue,
		};
	}

	async refresh(refreshTokenValue: string) {
		// Fetch all non-revoked tokens and validate via bcrypt comparison
		const activeTokens = await this.refreshTokenRepository.find({
			where: { revoked: false },
		});

		let matchedToken: RefreshToken | null = null;
		for (const token of activeTokens) {
			if (token.expiresAt < new Date()) continue;
			const isMatch = await bcrypt.compare(refreshTokenValue, token.token);
			if (isMatch) {
				matchedToken = token;
				break;
			}
		}

		if (!matchedToken) {
			throw new UnauthorizedException("Invalid or expired refresh token");
		}

		// Revoke old token (rotation — one-time use)
		await this.refreshTokenRepository.update(matchedToken.id, {
			revoked: true,
		});

		// Re-fetch user for fresh roles in new access token
		const user = await this.usersService.findOneById(matchedToken.userId);
		if (!user) {
			throw new UnauthorizedException("User not found");
		}

		const accessPayload = {
			email: user.email,
			sub: user.id,
			roles: user.roles ? user.roles.map((r) => r.name) : [],
		};

		// Issue new refresh token (rotation)
		const newRefreshTokenValue = uuidv4();
		const newRefreshTokenHash = await bcrypt.hash(newRefreshTokenValue, 10);

		await this.refreshTokenRepository.save({
			token: newRefreshTokenHash,
			userId: user.id,
			expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
		});

		return {
			access_token: this.jwtService.sign(accessPayload),
			refresh_token: newRefreshTokenValue,
		};
	}

	async logout(userId: string) {
		await this.refreshTokenRepository.update(
			{ userId, revoked: false },
			{ revoked: true },
		);
		return { message: "Logged out successfully" };
	}

	async verifyEmail(token: string) {
		const user = await this.usersService.findOneByVerificationToken(token);
		if (!user) {
			throw new BadRequestException("Token de verificación inválido");
		}

		await this.usersService.update(user.id, {
			isVerified: true,
			verificationToken: null,
		});

		return { message: "Correo verificado exitosamente." };
	}

	async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
		const user = await this.usersService.findOneByEmail(
			forgotPasswordDto.email,
		);
		if (!user) {
			return {
				message:
					"Si el correo existe, se enviará un enlace para restablecer la contraseña.",
			};
		}

		const resetToken = uuidv4();
		const expires = new Date();
		expires.setHours(expires.getHours() + 1);

		await this.usersService.update(user.id, {
			resetPasswordToken: resetToken,
			resetPasswordExpires: expires,
		});

		await this.mailerService.sendPasswordResetEmail(user.email, resetToken);

		return {
			message:
				"Si el correo existe, se enviará un enlace para restablecer la contraseña.",
		};
	}

	async resetPassword(resetPasswordDto: ResetPasswordDto) {
		const user = await this.usersService.findOneByResetToken(
			resetPasswordDto.token,
		);

		if (
			!user ||
			!user.resetPasswordExpires ||
			user.resetPasswordExpires < new Date()
		) {
			throw new BadRequestException(
				"Token de restablecimiento inválido o expirado",
			);
		}

		const hashedPassword = await bcrypt.hash(resetPasswordDto.password, 10);

		await this.usersService.update(user.id, {
			password: hashedPassword,
			resetPasswordToken: null,
			resetPasswordExpires: null,
		});

		return { message: "Contraseña restablecida exitosamente." };
	}

	async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
		const user = await this.usersService.findOneById(userId);
		if (!user) {
			throw new NotFoundException("Usuario no encontrado");
		}

		const isMatch = await bcrypt.compare(
			changePasswordDto.oldPassword,
			user.password,
		);
		if (!isMatch) {
			throw new BadRequestException("La contraseña actual es incorrecta");
		}

		const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
		await this.usersService.update(userId, { password: hashedPassword });

		return { message: "Contraseña actualizada exitosamente." };
	}

	async getProfile(userId: string) {
		const user = await this.usersService.findOneById(userId);
		if (!user) {
			throw new NotFoundException("Usuario no encontrado");
		}
		return {
			id: user.id,
			email: user.email,
			isVerified: user.isVerified,
			roles: user.roles.map((r) => r.name),
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
		};
	}
}
