import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddRefreshToken1785785104000 implements MigrationInterface {
	name = "AddRefreshToken1785785104000";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "token" character varying NOT NULL, "userId" uuid NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "revoked" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_refresh_tokens_id" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_refresh_tokens_token" ON "refresh_tokens" ("token")`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_refresh_tokens_userId_revoked" ON "refresh_tokens" ("userId", "revoked")`,
		);
		await queryRunner.query(
			`ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_refresh_tokens_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_refresh_tokens_userId"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_refresh_tokens_userId_revoked"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_refresh_tokens_token"`,
		);
		await queryRunner.query(`DROP TABLE "refresh_tokens"`);
	}
}
