import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto, AssignRoleDto } from './dto/create-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from '../users/users.service';

@ApiTags('roles')
@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class RolesController {
    constructor(
        private readonly rolesService: RolesService,
        private readonly usersService: UsersService
    ) { }

    @Post()
    create(@Body() createRoleDto: CreateRoleDto) {
        return this.rolesService.create(createRoleDto.name);
    }

    @Post('assign')
    assignRole(@Body() assignRoleDto: AssignRoleDto) {
        return this.usersService.addRole(assignRoleDto.userId, assignRoleDto.roleName);
    }

    @Get()
    findAll() {
        return this.rolesService.findAll();
    }
}
