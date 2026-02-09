import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from '../roles/entities/role.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(Role)
        private rolesRepository: Repository<Role>,
    ) { }

    async findOneById(id: number): Promise<User | null> {
        return this.usersRepository.findOne({ where: { id }, relations: ['roles'] });
    }

    async findOneByEmail(email: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { email }, relations: ['roles'] });
    }

    async findOneByVerificationToken(token: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { verificationToken: token }, relations: ['roles'] });
    }

    async findOneByResetToken(token: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { resetPasswordToken: token }, relations: ['roles'] });
    }

    async create(userData: Partial<User>): Promise<User> {
        const user = this.usersRepository.create(userData);

        // Assign default role 'user'
        const defaultRole = await this.rolesRepository.findOne({ where: { name: 'user' } });
        if (defaultRole) {
            user.roles = [defaultRole];
        }

        return this.usersRepository.save(user);
    }

    async update(id: number, updateData: Partial<User>): Promise<void> {
        await this.usersRepository.update(id, updateData);
    }
}
