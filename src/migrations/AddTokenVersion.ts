import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTokenVersion1770000000001 implements MigrationInterface {
  name = 'AddTokenVersion1770000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'tokenVersion',
        type: 'int',
        default: 0,
        isNullable: false,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'tokenVersion');
  }
}
