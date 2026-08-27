import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { Role } from '../roles/entities/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let userRepo: jest.Mocked<Repository<User>>;
  let roleRepo: jest.Mocked<Repository<Role>>;

  const mockUserRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    find: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockRoleRepo = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(Role), useValue: mockRoleRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepo = module.get(getRepositoryToken(User));
    roleRepo = module.get(getRepositoryToken(Role));

    jest.clearAllMocks();
  });

  describe('create', () => {
    const validDto: CreateUserDto = {
      email: 'test@example.com',
      password: 'hashedPassword123',
      verificationToken: 'verification-token-abc',
    };

    it('should force isVerified to false regardless of the input DTO', async () => {
      const customerRole = { id: 'role-1', name: 'customer' } as Role;
      roleRepo.findOne.mockResolvedValue(customerRole);

      // Capture what the service passes to repository.create()
      let createdEntity: Partial<User> | null = null;
      userRepo.create.mockImplementation((data: Partial<User>) => {
        createdEntity = data;
        return { id: 'user-1', ...data, roles: [] } as unknown as User;
      });

      // Capture what the service passes to repository.save()
      let savedEntity: User | null = null;
      userRepo.save.mockImplementation((entity: User) => {
        savedEntity = entity;
        return Promise.resolve({ ...entity, id: 'user-1' } as User);
      });

      await service.create(validDto);

      // PROVE: the entity passed to save() has isVerified EXPLICITLY forced to false
      // This test SHOULD FAIL because currently the service does NOT force isVerified
      expect(savedEntity).not.toBeNull();
      expect(savedEntity!.isVerified).toBe(false);

      // PROVE: the DTO data made it through
      expect(savedEntity!.email).toBe(validDto.email);
      expect(savedEntity!.verificationToken).toBe(validDto.verificationToken);
    });

    it('should create a user with valid fields and assign default customer role', async () => {
      const customerRole = { id: 'role-1', name: 'customer' } as Role;
      roleRepo.findOne.mockResolvedValue(customerRole);

      let savedEntity: User | null = null;
      userRepo.create.mockImplementation(
        (data: Partial<User>) => ({ id: 'user-2', ...data, roles: [] } as unknown as User),
      );
      userRepo.save.mockImplementation((entity: User) => {
        savedEntity = entity;
        return Promise.resolve({ ...entity, id: 'user-2' } as User);
      });

      await service.create(validDto);

      expect(savedEntity).not.toBeNull();
      expect(savedEntity!.email).toBe(validDto.email);
      expect(savedEntity!.verificationToken).toBe(validDto.verificationToken);
      expect(savedEntity!.isVerified).toBe(false);
      expect(savedEntity!.roles).toHaveLength(1);
      expect(savedEntity!.roles[0].name).toBe('customer');
    });

    it('should fallback to "user" role when "customer" role is not found', async () => {
      const userRole = { id: 'role-2', name: 'user' } as Role;

      // First call (customer) returns null
      roleRepo.findOne.mockResolvedValueOnce(null);
      // Second call (user fallback) returns user role
      roleRepo.findOne.mockResolvedValueOnce(userRole);

      let savedEntity: User | null = null;
      userRepo.create.mockImplementation(
        (data: Partial<User>) => ({ id: 'user-3', ...data, roles: [] } as unknown as User),
      );
      userRepo.save.mockImplementation((entity: User) => {
        savedEntity = entity;
        return Promise.resolve({ ...entity, id: 'user-3' } as User);
      });

      await service.create(validDto);

      expect(savedEntity).not.toBeNull();
      expect(savedEntity!.roles[0].name).toBe('user');
    });
  });

  describe('update', () => {
    it('should accept only whitelisted fields from UpdateUserDto', async () => {
      const updateDto: UpdateUserDto = {
        password: 'newHashedPassword',
        isVerified: true,
        verificationToken: null,
        resetPasswordToken: 'reset-123',
        resetPasswordExpires: new Date().toISOString(),
      };

      await service.update('user-id', updateDto);

      // The update call forwards the DTO fields to the repository
      expect(userRepo.update).toHaveBeenCalledWith('user-id', updateDto);
    });

    it('should allow partial updates with only some fields', async () => {
      const partialDto: UpdateUserDto = {
        password: 'onlyPassword',
      };

      await service.update('user-id', partialDto);

      expect(userRepo.update).toHaveBeenCalledWith('user-id', partialDto);
    });
  });
});
