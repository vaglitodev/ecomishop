import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { UsersService } from '../users/users.service';
import type { AssignRoleDto, CreateRoleDto } from './dto/create-role.dto';
import type { RolesService } from './roles.service';

@ApiTags('roles')
@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class RolesController {
  constructor(
    private readonly rolesService: RolesService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto.name);
  }

  @Post('assign')
  assignRole(@Body() assignRoleDto: AssignRoleDto) {
    return this.usersService.addRole(
      assignRoleDto.userId,
      assignRoleDto.roleName,
    );
  }

  @Get()
  findAll() {
    return this.rolesService.findAll();
  }
}
