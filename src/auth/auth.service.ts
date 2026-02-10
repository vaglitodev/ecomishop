import { Injectable, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { MailerService } from '../mailer/mailer.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto, ChangePasswordDto } from './dto/auth.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private mailerService: MailerService,
    ) { }

    async register(registerDto: RegisterDto) {
        const existingUser = await this.usersService.findOneByEmail(registerDto.email);
        if (existingUser) {
            throw new BadRequestException('El usuario ya existe');
        }

        const hashedPassword = await bcrypt.hash(registerDto.password, 10);
        const verificationToken = uuidv4();

        // Assign 'user' role by default logic would be inside usersService.create theoretically,
        // or we can explicitly fetch it if we want strict control.
        // simpler: usersService.create will save the user. 
        // If we want default role, we need to assign it.
        // Let's assume UsersService handles basic user creation. 
        // Ideally we should assign the default Role here or in the Service.
        // Let's create the user without roles first, then adding roles would require a relation update.
        // But since we want to keep it simple, let's rely on role seeding happening and us fetching it.
        // However, to avoid complexity in this file, let's update UsersService to handle default role.

        const user = await this.usersService.create({
            email: registerDto.email,
            password: hashedPassword,
            verificationToken,
        });

        await this.mailerService.sendVerificationEmail(user.email, verificationToken);

        return { message: 'Registro exitoso. Revisa tu correo para verificar tu cuenta.' };
    }

    async login(loginDto: LoginDto) {
        const user = await this.usersService.findOneByEmail(loginDto.email);
        if (!user) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        const isMatch = await bcrypt.compare(loginDto.password, user.password);
        if (!isMatch) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        if (!user.isVerified) {
            throw new UnauthorizedException('Por favor verifica tu correo electrónico');
        }

        const payload = {
            email: user.email,
            sub: user.id,
            roles: user.roles ? user.roles.map(r => r.name) : []
        };

        return {
            user,
            access_token: this.jwtService.sign(payload),
        };
    }

    async verifyEmail(token: string) {
        const user = await this.usersService.findOneByVerificationToken(token);
        if (!user) {
            throw new BadRequestException('Token de verificación inválido');
        }

        await this.usersService.update(user.id, {
            isVerified: true,
            verificationToken: null,
        });

        return { message: 'Correo verificado exitosamente.' };
    }

    async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
        const user = await this.usersService.findOneByEmail(forgotPasswordDto.email);
        if (!user) {
            return { message: 'Si el correo existe, se enviará un enlace para restablecer la contraseña.' };
        }

        const resetToken = uuidv4();
        const expires = new Date();
        expires.setHours(expires.getHours() + 1);

        await this.usersService.update(user.id, {
            resetPasswordToken: resetToken,
            resetPasswordExpires: expires,
        });

        await this.mailerService.sendPasswordResetEmail(user.email, resetToken);

        return { message: 'Si el correo existe, se enviará un enlace para restablecer la contraseña.' };
    }

    async resetPassword(resetPasswordDto: ResetPasswordDto) {
        const user = await this.usersService.findOneByResetToken(resetPasswordDto.token);

        if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
            throw new BadRequestException('Token de restablecimiento inválido o expirado');
        }

        const hashedPassword = await bcrypt.hash(resetPasswordDto.password, 10);

        await this.usersService.update(user.id, {
            password: hashedPassword,
            resetPasswordToken: null,
            resetPasswordExpires: null,
        });

        return { message: 'Contraseña restablecida exitosamente.' };
    }

    async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
        const user = await this.usersService.findOneById(userId);
        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        const isMatch = await bcrypt.compare(changePasswordDto.oldPassword, user.password);
        if (!isMatch) {
            throw new BadRequestException('La contraseña actual es incorrecta');
        }

        const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
        await this.usersService.update(userId, { password: hashedPassword });

        return { message: 'Contraseña actualizada exitosamente.' };
    }

    async getProfile(userId: string) {
        const user = await this.usersService.findOneById(userId);
        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }
        return user;
    }
}
