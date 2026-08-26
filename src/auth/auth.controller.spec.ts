import { AuthController } from "./auth.controller";
import type { AuthService } from "./auth.service";

describe("AuthController", () => {
	let controller: AuthController;
	let authService: {
		login: jest.Mock;
		register: jest.Mock;
		verifyEmail: jest.Mock;
		forgotPassword: jest.Mock;
		resetPassword: jest.Mock;
		changePassword: jest.Mock;
		getProfile: jest.Mock;
		refresh: jest.Mock;
		logout: jest.Mock;
	};

	beforeEach(() => {
		authService = {
			login: jest.fn(),
			register: jest.fn(),
			verifyEmail: jest.fn(),
			forgotPassword: jest.fn(),
			resetPassword: jest.fn(),
			changePassword: jest.fn(),
			getProfile: jest.fn(),
			refresh: jest.fn(),
			logout: jest.fn(),
		};

		controller = new AuthController(authService as any);
		jest.clearAllMocks();
	});

	describe("POST /auth/refresh", () => {
		it("should call authService.refresh with refreshToken from DTO", async () => {
			const dto = { refreshToken: "550e8400-e29b-41d4-a716-446655440000" };
			authService.refresh.mockResolvedValue({
				access_token: "new-access",
				refresh_token: "new-refresh",
			});

			const result = await controller.refresh(dto);

			expect(authService.refresh).toHaveBeenCalledWith(dto.refreshToken);
			expect(result).toEqual({
				access_token: "new-access",
				refresh_token: "new-refresh",
			});
		});

		it("should propagate errors from authService.refresh", async () => {
			const dto = { refreshToken: "invalid-token" };
			authService.refresh.mockRejectedValue(new Error("Invalid token"));

			await expect(controller.refresh(dto)).rejects.toThrow("Invalid token");
		});
	});

	describe("POST /auth/logout", () => {
		it("should call authService.logout with userId from request", async () => {
			const req = { user: { userId: "user-1" } };
			authService.logout.mockResolvedValue({
				message: "Logged out successfully",
			});

			const result = await controller.logout(req);

			expect(authService.logout).toHaveBeenCalledWith("user-1");
			expect(result).toEqual({ message: "Logged out successfully" });
		});
	});
});
