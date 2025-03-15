import { Migration } from '@mikro-orm/migrations';

export class Migration20250315062807 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "wiper" ("id" text not null, "name" text not null, "code" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "wiper_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_wiper_deleted_at" ON "wiper" (deleted_at) WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "wiper_connector" ("id" text not null, "name" text not null, "code" text not null, "type" text not null, "media_url" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "wiper_connector_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_wiper_connector_deleted_at" ON "wiper_connector" (deleted_at) WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "wiper_arm" ("id" text not null, "name" text not null, "code" text not null, "connector_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "wiper_arm_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_wiper_arm_connector_id" ON "wiper_arm" (connector_id) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_wiper_arm_deleted_at" ON "wiper_arm" (deleted_at) WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "wiper_kit" ("id" text not null, "name" text not null, "code" text not null, "wiper_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "wiper_kit_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_wiper_kit_wiper_id" ON "wiper_kit" (wiper_id) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_wiper_kit_deleted_at" ON "wiper_kit" (deleted_at) WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "wiper_length" ("id" text not null, "value" integer not null, "unit" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "wiper_length_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_wiper_length_deleted_at" ON "wiper_length" (deleted_at) WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "wiper_arm" add constraint "wiper_arm_connector_id_foreign" foreign key ("connector_id") references "wiper_connector" ("id") on update cascade;`);

    this.addSql(`alter table if exists "wiper_kit" add constraint "wiper_kit_wiper_id_foreign" foreign key ("wiper_id") references "wiper" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "wiper_kit" drop constraint if exists "wiper_kit_wiper_id_foreign";`);

    this.addSql(`alter table if exists "wiper_arm" drop constraint if exists "wiper_arm_connector_id_foreign";`);

    this.addSql(`drop table if exists "wiper" cascade;`);

    this.addSql(`drop table if exists "wiper_connector" cascade;`);

    this.addSql(`drop table if exists "wiper_arm" cascade;`);

    this.addSql(`drop table if exists "wiper_kit" cascade;`);

    this.addSql(`drop table if exists "wiper_length" cascade;`);
  }

}
