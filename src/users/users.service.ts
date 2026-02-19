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

    async findOneById(id: string): Promise<User | null> {
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

        // Assign default role 'customer'
        const defaultRole = await this.rolesRepository.findOne({ where: { name: 'customer' } });
        if (defaultRole) {
            user.roles = [defaultRole];
        } else {
            // Fallback: try to find 'user' or just proceed without roles if not found
            const fallbackRole = await this.rolesRepository.findOne({ where: { name: 'user' } });
            if (fallbackRole) user.roles = [fallbackRole];
        }

        return this.usersRepository.save(user);
    }

    async update(id: string, updateData: Partial<User>): Promise<void> {
        await this.usersRepository.update(id, updateData);
    }

    async addRole(userId: string, roleName: string): Promise<User> {
        const user = await this.findOneById(userId);
        if (!user) {
            throw new Error('Usuario no encontrado');
        }
        const role = await this.rolesRepository.findOne({ where: { name: roleName } });
        if (!role) {
            throw new Error('Rol no encontrado');
        }

        // Check if user already has role
        if (!user.roles.some(r => r.name === roleName)) {
            user.roles.push(role);
            return this.usersRepository.save(user);
        }
        return user;
    }

    async findAll(): Promise<User[]> {
        return this.usersRepository.find({ relations: ['roles'] });
    }

    async remove(id: string): Promise<void> {
        await this.usersRepository.softDelete(id);
    }
}
