import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';

@Injectable()
export class RolesService implements OnModuleInit {
    constructor(
        @InjectRepository(Role)
        private roleRepository: Repository<Role>,
    ) { }

    async onModuleInit() {
        await this.seedRoles();
    }

    async seedRoles() {
        const defaultRoles = ['user', 'admin'];
        for (const roleName of defaultRoles) {
            const existingRole = await this.roleRepository.findOne({ where: { name: roleName } });
            if (!existingRole) {
                await this.roleRepository.save({ name: roleName });
                console.log(`Role ${roleName} created.`);
            }
        }
    }

    async findByName(name: string): Promise<Role | null> {
        return this.roleRepository.findOne({ where: { name } });
    }

    async findAll(): Promise<Role[]> {
        return this.roleRepository.find();
    }
}
