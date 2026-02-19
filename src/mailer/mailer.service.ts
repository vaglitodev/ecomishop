import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
    private transporter: nodemailer.Transporter;

    constructor(private configService: ConfigService) {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: this.configService.get<string>('MAIL_USER'),
                pass: this.configService.get<string>('MAIL_PASS'),
            },
        });
    }

    async sendVerificationEmail(email: string, token: string) {
        const url = `${this.configService.get<string>('FRONTEND_URL')}/verify-email?token=${token}`;
        await this.transporter.sendMail({
            from: this.configService.get<string>('MAIL_FROM'),
            to: email,
            subject: 'Verifica tu correo electrónico',
            html: `Haz clic en este enlace para verificar tu correo: <a href="${url}">${url}</a>`,
        });
    }

    async sendPasswordResetEmail(email: string, token: string) {
        const url = `${this.configService.get<string>('FRONTEND_URL')}/reset-password?token=${token}`;
        await this.transporter.sendMail({
            from: this.configService.get<string>('MAIL_FROM'),
            to: email,
            subject: 'Restablecer contraseña',
            html: `Haz clic en este enlace para restablecer tu contraseña: <a href="${url}">${url}</a>`,
        });
    }
}
