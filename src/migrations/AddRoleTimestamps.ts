import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddRoleTimestamps1770000000002 implements MigrationInterface {
  name = 'AddRoleTimestamps1770000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'roles',
      new TableColumn({
        name: 'createdAt',
        type: 'timestamp',
        default: 'now()',
        isNullable: false,
      })
    );

    await queryRunner.addColumn(
      'roles',
      new TableColumn({
        name: 'updatedAt',
        type: 'timestamp',
        default: 'now()',
        isNullable: false,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('roles', 'createdAt');
    await queryRunner.dropColumn('roles', 'updatedAt');
  }
}
