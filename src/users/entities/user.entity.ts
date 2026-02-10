import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { Exclude } from 'class-transformer';
import { Role } from '../../roles/entities/role.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column()
    @Exclude()
    password: string;

    @Column({ default: false })
    isVerified: boolean;

    @Column({ type: 'varchar', nullable: true })
    @Exclude()
    verificationToken: string | null;

    @Column({ type: 'varchar', nullable: true })
    @Exclude()
    resetPasswordToken: string | null;

    @Column({ type: 'timestamp', nullable: true })
    @Exclude()
    resetPasswordExpires: Date | null;

    @ManyToMany(() => Role, (role) => role.users, { cascade: true, eager: true })
    @JoinTable()
    roles: Role[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
