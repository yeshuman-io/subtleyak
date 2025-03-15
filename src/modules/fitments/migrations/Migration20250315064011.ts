import { Migration } from '@mikro-orm/migrations';

export class Migration20250315064011 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "fitment" ("id" text not null, "code" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "fitment_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fitment_deleted_at" ON "fitment" (deleted_at) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "fitment" cascade;`);
  }

}
