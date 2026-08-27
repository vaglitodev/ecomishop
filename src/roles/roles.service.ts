import { BadRequestException, Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { Role } from './entities/role.entity';

@Injectable()
export class RolesService implements OnModuleInit {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async onModuleInit() {
    await this.seedRoles();
  }

  async seedRoles() {
    const defaultRoles = ['admin', 'staff', 'customer'];
    for (const roleName of defaultRoles) {
      const existingRole = await this.roleRepository.findOne({
        where: { name: roleName },
      });
      if (!existingRole) {
        await this.roleRepository.save({ name: roleName });
        this.logger.log(`Role ${roleName} created.`);
      }
    }
  }

  async findByName(name: string): Promise<Role | null> {
    return this.roleRepository.findOne({ where: { name } });
  }

  async findAll(): Promise<Role[]> {
    return this.roleRepository.find();
  }

  async create(name: string): Promise<Role> {
    const existingRole = await this.roleRepository.findOne({ where: { name } });
    if (existingRole) {
      throw new BadRequestException('El rol ya existe');
    }
    const role = this.roleRepository.create({ name });
    return this.roleRepository.save(role);
  }
}
