import { Migration } from '@mikro-orm/migrations';

export class Migration20250131140640 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "vehicle" add column if not exists "startYear" integer not null default 2000, add column if not exists "endYear" integer not null default 2001;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "vehicle" drop column if exists "startYear", drop column if exists "endYear";`);
  }

}
