import { validate } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

describe('CreateUserDto', () => {
  describe('validation', () => {
    it('should pass with valid data', async () => {
      const dto = new CreateUserDto();
      dto.email = 'test@example.com';
      dto.password = 'password123';
      dto.verificationToken = 'abc-token-123';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail when email is missing', async () => {
      const dto = new CreateUserDto();
      dto.password = 'password123';
      dto.verificationToken = 'abc-token-123';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'email')).toBe(true);
    });

    it('should fail when email is invalid format', async () => {
      const dto = new CreateUserDto();
      dto.email = 'not-an-email';
      dto.password = 'password123';
      dto.verificationToken = 'abc-token-123';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'email')).toBe(true);
    });

    it('should fail when password is missing', async () => {
      const dto = new CreateUserDto();
      dto.email = 'test@example.com';
      dto.verificationToken = 'abc-token-123';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'password')).toBe(true);
    });

    it('should fail when password is too short', async () => {
      const dto = new CreateUserDto();
      dto.email = 'test@example.com';
      dto.password = '12345';
      dto.verificationToken = 'abc-token-123';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'password')).toBe(true);
    });

    it('should fail when verificationToken is missing', async () => {
      const dto = new CreateUserDto();
      dto.email = 'test@example.com';
      dto.password = 'password123';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'verificationToken')).toBe(true);
    });
  });
});
