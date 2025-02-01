import { Migration } from '@mikro-orm/migrations';

export class Migration20250201075610 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "vehicle" rename column "startYear" to "start_year";`);
    this.addSql(`alter table if exists "vehicle" rename column "endYear" to "end_year";`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "vehicle" rename column "start_year" to "startYear";`);
    this.addSql(`alter table if exists "vehicle" rename column "end_year" to "endYear";`);
  }

}
