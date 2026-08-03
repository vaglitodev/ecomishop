import { Exclude } from "class-transformer";
import {
	Column,
	CreateDateColumn,
	DeleteDateColumn,
	Entity,
	JoinTable,
	ManyToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";
import { Role } from "../../roles/entities/role.entity";

@Entity("users")
export class User {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({ unique: true })
	email: string;

	@Column()
	@Exclude()
	password: string;

	@Column({ default: false })
	isVerified: boolean;

	@Column({ type: "varchar", nullable: true })
	@Exclude()
	verificationToken: string | null;

	@Column({ type: "varchar", nullable: true })
	@Exclude()
	resetPasswordToken: string | null;

	@Column({ type: "timestamp", nullable: true })
	@Exclude()
	resetPasswordExpires: Date | null;

	@ManyToMany(
		() => Role,
		(role) => role.users,
		{ cascade: true },
	)
	@JoinTable()
	roles: Role[];

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;

	@DeleteDateColumn()
	deletedAt: Date;
}
