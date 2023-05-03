import { Migration } from '@mikro-orm/migrations';

export class Migration20230503202222 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "messages" add column "deletedAt" timestamptz(0) null;');
  }

  async down(): Promise<void> {
    this.addSql('alter table "messages" drop column "deletedAt";');
  }

}
