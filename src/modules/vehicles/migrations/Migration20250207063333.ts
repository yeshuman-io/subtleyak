import { Migration } from '@mikro-orm/migrations';

export class Migration20250207063333 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "vehicle_body" ("id" text not null, "name" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "vehicle_body_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_vehicle_body_deleted_at" ON "vehicle_body" (deleted_at) WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "vehicle_model_body" ("model_id" text not null, "body_id" text not null, constraint "vehicle_model_body_pkey" primary key ("model_id", "body_id"));`);

    this.addSql(`alter table if exists "vehicle_model_body" add constraint "vehicle_model_body_model_id_foreign" foreign key ("model_id") references "vehicle_model" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table if exists "vehicle_model_body" add constraint "vehicle_model_body_body_id_foreign" foreign key ("body_id") references "vehicle_body" ("id") on update cascade on delete cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "vehicle_model_body" drop constraint if exists "vehicle_model_body_body_id_foreign";`);

    this.addSql(`drop table if exists "vehicle_body" cascade;`);

    this.addSql(`drop table if exists "vehicle_model_body" cascade;`);
  }

}
