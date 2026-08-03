import { ConfigService } from "@nestjs/config";
import { requireSecret } from "./utils/require-secret";

// ---------------------------------------------------------------------------
// Task 1.3 / 3.1 — Unit tests for requireSecret() shared helper
//
// Phase 1 (RED):  test expected the factory to throw when JWT_SECRET is
//                 missing — confirmed RED via the factory-boundary test.
// Phase 2 (GREEN): auth.module.ts and jwt.strategy.ts now both throw.
// Phase 3 (REFACTOR): the guard was extracted to requireSecret() — tested
//                     here as a pure unit with zero NestJS overhead.
// ---------------------------------------------------------------------------

describe("requireSecret", () => {
	const errorMessage = "JWT_SECRET is not configured";

	function buildConfigService(secret: string | undefined | null): ConfigService {
		return { get: jest.fn().mockReturnValue(secret) } as unknown as ConfigService;
	}

	it("throws when JWT_SECRET is an empty string", () => {
		expect(() => requireSecret(buildConfigService(""))).toThrow(errorMessage);
	});

	it("throws when JWT_SECRET is undefined", () => {
		expect(() => requireSecret(buildConfigService(undefined))).toThrow(errorMessage);
	});

	it("throws when JWT_SECRET is null", () => {
		expect(() => requireSecret(buildConfigService(null))).toThrow(errorMessage);
	});

	it("returns the secret when JWT_SECRET is a valid string", () => {
		expect(requireSecret(buildConfigService("my-super-secret"))).toBe(
			"my-super-secret",
		);
	});
});
