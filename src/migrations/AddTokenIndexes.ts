import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class AddTokenIndexes1770000000000 implements MigrationInterface {
  name = 'AddTokenIndexes1770000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_users_verification_token',
        columnNames: ['verificationToken'],
      })
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_users_reset_password_token',
        columnNames: ['resetPasswordToken'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('users', 'IDX_users_verification_token');
    await queryRunner.dropIndex('users', 'IDX_users_reset_password_token');
  }
}
