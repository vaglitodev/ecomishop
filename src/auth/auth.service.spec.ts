import { UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import type { JwtService } from "@nestjs/jwt";
import type { MailerService } from "../mailer/mailer.service";
import type { UsersService } from "../users/users.service";
import { RefreshToken } from "./entities/refresh-token.entity";
import { AuthService } from "./auth.service";

jest.mock("bcrypt", () => ({
	hash: jest.fn(),
	compare: jest.fn(),
}));

jest.mock("uuid", () => ({
	v4: jest.fn(),
}));

describe("AuthService", () => {
	let service: AuthService;
	let usersService: jest.Mocked<Pick<UsersService, "findOneByEmail" | "findOneById">>;
	let jwtService: jest.Mocked<Pick<JwtService, "sign">>;
	let mailerService: jest.Mocked<Partial<MailerService>>;
	let refreshTokenRepo: {
		save: jest.Mock;
		find: jest.Mock;
		update: jest.Mock;
	};

	const mockUser = {
		id: "user-1",
		email: "test@example.com",
		password: "hashedpassword123",
		isVerified: true,
		roles: [{ name: "customer" }],
	};

	const mockRefreshToken: RefreshToken = {
		id: "rt-1",
		token: "hashed-refresh-token",
		userId: "user-1",
		expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
		revoked: false,
		createdAt: new Date(),
	};

	function createService() {
		// Direct instantiation — bypass NestJS DI to avoid token resolution issues
		service = new AuthService(
			usersService as any,
			jwtService as any,
			mailerService as any,
			refreshTokenRepo as any,
		);
	}

	beforeEach(() => {
		usersService = {
			findOneByEmail: jest.fn(),
			findOneById: jest.fn(),
		};

		jwtService = {
			sign: jest.fn().mockReturnValue("mock-access-token"),
		};

		mailerService = {};

		refreshTokenRepo = {
			save: jest.fn(),
			find: jest.fn(),
			update: jest.fn(),
		};

		jest.clearAllMocks();
	});

	// ========================================================================
	// RED tests — login returns refresh_token
	// ========================================================================
	describe("login", () => {
		it("should return access_token and refresh_token on success", async () => {
			usersService.findOneByEmail.mockResolvedValue(mockUser);
			(bcrypt.compare as jest.Mock).mockResolvedValue(true);
			(uuidv4 as jest.Mock).mockReturnValue("refresh-uuid-abc");
			(bcrypt.hash as jest.Mock).mockResolvedValue("hashed-refresh-uuid");
			refreshTokenRepo.save.mockResolvedValue({
				id: "rt-1",
				token: "hashed-refresh-uuid",
				userId: "user-1",
				expiresAt: new Date(),
				revoked: false,
				createdAt: new Date(),
			});

			createService();
			const result = await service.login({
				email: "test@example.com",
				password: "password123",
			});

			expect(result).toHaveProperty("access_token");
			expect(result).toHaveProperty("refresh_token");
			expect(result.refresh_token).toBe("refresh-uuid-abc");
			expect(refreshTokenRepo.save).toHaveBeenCalledWith(
				expect.objectContaining({
					token: "hashed-refresh-uuid",
					userId: "user-1",
				}),
			);
		});

		it("should store refresh token with expiry ~7 days in future", async () => {
			const beforeCall = Date.now();
			usersService.findOneByEmail.mockResolvedValue(mockUser);
			(bcrypt.compare as jest.Mock).mockResolvedValue(true);
			(uuidv4 as jest.Mock).mockReturnValue("refresh-uuid");
			(bcrypt.hash as jest.Mock).mockResolvedValue("hashed");

			createService();
			await service.login({ email: "test@example.com", password: "pw" });

			const saveCallArg = refreshTokenRepo.save.mock.calls[0][0];
			const expiresAt = saveCallArg.expiresAt as Date;
			const diffMs = expiresAt.getTime() - beforeCall;
			const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

			expect(diffMs).toBeGreaterThan(sevenDaysMs - 5000);
			expect(diffMs).toBeLessThan(sevenDaysMs + 5000);
		});
	});

	// ========================================================================
	// RED tests — refresh token rotation
	// ========================================================================
	describe("refresh", () => {
		it("should return new access_token and refresh_token for valid token", async () => {
			refreshTokenRepo.find.mockResolvedValue([mockRefreshToken]);
			(bcrypt.compare as jest.Mock).mockResolvedValue(true);
			usersService.findOneById.mockResolvedValue(mockUser);
			(uuidv4 as jest.Mock).mockReturnValue("new-refresh-uuid");
			(bcrypt.hash as jest.Mock).mockResolvedValue("new-hashed");

			createService();
			const result = await service.refresh("valid-refresh-token-value");

			expect(result).toHaveProperty("access_token");
			expect(result).toHaveProperty("refresh_token");
			expect(result.refresh_token).toBe("new-refresh-uuid");
		});

		it("should revoke old token (rotation — one-time use)", async () => {
			refreshTokenRepo.find.mockResolvedValue([mockRefreshToken]);
			(bcrypt.compare as jest.Mock).mockResolvedValue(true);
			usersService.findOneById.mockResolvedValue(mockUser);
			(uuidv4 as jest.Mock).mockReturnValue("new-uuid");
			(bcrypt.hash as jest.Mock).mockResolvedValue("new-hash");

			createService();
			await service.refresh("valid-token");

			expect(refreshTokenRepo.update).toHaveBeenCalledWith(
				mockRefreshToken.id,
				{ revoked: true },
			);
		});

		it("should throw UnauthorizedException for revoked token", async () => {
			const revokedToken = { ...mockRefreshToken, revoked: true };
			refreshTokenRepo.find.mockResolvedValue([revokedToken]);

			createService();
			await expect(service.refresh("revoked-token-value")).rejects.toThrow(
				UnauthorizedException,
			);
		});

		it("should throw UnauthorizedException for expired token", async () => {
			const expiredToken = {
				...mockRefreshToken,
				expiresAt: new Date(Date.now() - 1000),
			};
			refreshTokenRepo.find.mockResolvedValue([expiredToken]);

			createService();
			await expect(service.refresh("expired-token-value")).rejects.toThrow(
				UnauthorizedException,
			);
		});

		it("should throw UnauthorizedException for token that matches no hash", async () => {
			refreshTokenRepo.find.mockResolvedValue([mockRefreshToken]);
			(bcrypt.compare as jest.Mock).mockResolvedValue(false);

			createService();
			await expect(service.refresh("unknown-token")).rejects.toThrow(
				UnauthorizedException,
			);
		});

		it("should re-fetch user roles on refresh (stale roles fix)", async () => {
			const userWithNewRoles = {
				...mockUser,
				roles: [{ name: "admin" }],
			};
			refreshTokenRepo.find.mockResolvedValue([mockRefreshToken]);
			(bcrypt.compare as jest.Mock).mockResolvedValue(true);
			usersService.findOneById.mockResolvedValue(userWithNewRoles);
			(uuidv4 as jest.Mock).mockReturnValue("new-uuid");
			(bcrypt.hash as jest.Mock).mockResolvedValue("new-hash");

			createService();
			await service.refresh("valid-token");

			expect(jwtService.sign).toHaveBeenCalledWith(
				expect.objectContaining({
					roles: ["admin"],
				}),
			);
		});

		it("should throw UnauthorizedException when user no longer exists", async () => {
			refreshTokenRepo.find.mockResolvedValue([mockRefreshToken]);
			(bcrypt.compare as jest.Mock).mockResolvedValue(true);
			usersService.findOneById.mockResolvedValue(null);

			createService();
			await expect(service.refresh("valid-token")).rejects.toThrow(
				UnauthorizedException,
			);
		});
	});

	// ========================================================================
	// RED tests — logout
	// ========================================================================
	describe("logout", () => {
		it("should revoke all active refresh tokens for user", async () => {
			refreshTokenRepo.update.mockResolvedValue({ affected: 2 });

			createService();
			const result = await service.logout("user-1");

			expect(refreshTokenRepo.update).toHaveBeenCalledWith(
				{ userId: "user-1", revoked: false },
				{ revoked: true },
			);
			expect(result).toEqual({ message: "Logged out successfully" });
		});

		it("should handle logout for user with no active tokens", async () => {
			refreshTokenRepo.update.mockResolvedValue({ affected: 0 });

			createService();
			const result = await service.logout("user-1");

			expect(result).toEqual({ message: "Logged out successfully" });
		});
	});

	// ========================================================================
	// Integration: refresh after logout
	// ========================================================================
	describe("refresh after logout", () => {
		it("should reject refresh after all tokens revoked", async () => {
			refreshTokenRepo.find.mockResolvedValue([]);

			createService();
			await expect(service.refresh("old-token")).rejects.toThrow(
				UnauthorizedException,
			);
		});
	});
});
