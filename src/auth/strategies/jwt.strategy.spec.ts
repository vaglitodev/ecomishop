import { ConfigService } from "@nestjs/config";
import { JwtStrategy } from "./jwt.strategy";

// ---------------------------------------------------------------------------
// Phase 1 — RED tests (tasks 1.1, 1.2)
//
// These tests describe the behaviour we WANT.  They WILL fail against the
// current production code because:
//   1.1  The constructor currently falls back to "defaultSecret" instead of
//        throwing when JWT_SECRET is missing.
//   1.2  validate() is straightforward — this test will pass immediately, but
//        it anchors the expected payload shape to prevent regressions.
// ---------------------------------------------------------------------------

describe("JwtStrategy", () => {
	// -- Task 1.1: constructor throws when JWT_SECRET is falsy ----------------

	describe("constructor — JWT_SECRET guard", () => {
		const errorMessage = "JWT_SECRET is not configured";

		it("REJECTS an empty string (RED — currently falls back to defaultSecret)", () => {
			const configService = {
				get: jest.fn().mockReturnValue(""),
			} as unknown as ConfigService;

			expect(() => new JwtStrategy(configService)).toThrow(errorMessage);
		});

		it("REJECTS undefined (RED — currently falls back to defaultSecret)", () => {
			const configService = {
				get: jest.fn().mockReturnValue(undefined),
			} as unknown as ConfigService;

			expect(() => new JwtStrategy(configService)).toThrow(errorMessage);
		});

		it("REJECTS null (RED — currently falls back to defaultSecret)", () => {
			const configService = {
				get: jest.fn().mockReturnValue(null),
			} as unknown as ConfigService;

			expect(() => new JwtStrategy(configService)).toThrow(errorMessage);
		});
	});

	// -- Task 1.2: validate() returns correct payload shape -----------------

	describe("validate", () => {
		it("maps JWT payload sub/email/roles to userId/email/roles", async () => {
			const configService = {
				get: jest.fn().mockReturnValue("a-valid-test-secret"),
			} as unknown as ConfigService;

			const strategy = new JwtStrategy(configService);

			const result = await strategy.validate({
				sub: "user-42",
				email: "cesar@example.com",
				roles: ["admin", "editor"],
			});

			expect(result).toEqual({
				userId: "user-42",
				email: "cesar@example.com",
				roles: ["admin", "editor"],
			});
		});

		it("handles payloads with missing optional fields gracefully", async () => {
			const configService = {
				get: jest.fn().mockReturnValue("a-valid-test-secret"),
			} as unknown as ConfigService;

			const strategy = new JwtStrategy(configService);

			const result = await strategy.validate({ sub: "99" });

			expect(result).toEqual({
				userId: "99",
				email: undefined,
				roles: undefined,
			});
		});
	});
});
