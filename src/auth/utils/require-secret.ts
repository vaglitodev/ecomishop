import type { ConfigService } from "@nestjs/config";

/**
 * Retrieves JWT_SECRET from the ConfigService and throws if it is missing.
 *
 * Centralised guard — used by both jwt.strategy.ts (verification) and
 * auth.module.ts (signing) so the error message stays consistent and the
 * check cannot drift between the two call sites.
 */
export function requireSecret(configService: ConfigService): string {
	const secret = configService.get<string>("JWT_SECRET");
	if (!secret) {
		throw new Error("JWT_SECRET is not configured");
	}
	return secret;
}
