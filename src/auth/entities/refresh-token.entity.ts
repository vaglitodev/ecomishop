import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
} from "typeorm";

@Entity("refresh_tokens")
export class RefreshToken {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({ type: "varchar" })
	token: string;

	@Column({ type: "uuid" })
	userId: string;

	@Column({ type: "timestamp" })
	expiresAt: Date;

	@Column({ default: false })
	revoked: boolean;

	@CreateDateColumn()
	createdAt: Date;
}
