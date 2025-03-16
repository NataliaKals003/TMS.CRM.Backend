/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema
    .createTable('Tenant', (table) => {
      table.increments('Id').primary();
      table.uuid('ExternalUuid').unique().notNullable().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('Name', 50);
      table.timestamp('CreatedOn').defaultTo(knex.fn.now()).notNullable();
      table.timestamp('ModifiedOn');
      table.timestamp('DeletedOn');
    })
    .createTable('User', (table) => {
      table.increments('Id').primary();
      table.uuid('ExternalUuid').unique().notNullable().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('FirstName', 50);
      table.string('LastName', 50);
      table.string('Email', 100);
      table.timestamp('CreatedOn').defaultTo(knex.fn.now()).notNullable();
      table.timestamp('ModifiedOn');
      table.timestamp('DeletedOn');
    })
    .createTable('UserTenant', (table) => {
      table.increments('Id').primary();
      table.integer('UserId').references('Id').inTable('User');
      table.integer('TenantId').references('Id').inTable('Tenant');
      table.timestamp('CreatedOn').defaultTo(knex.fn.now()).notNullable();
      table.timestamp('ModifiedOn');
      table.timestamp('DeletedOn');
    });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('UserTenant').dropTableIfExists('User').dropTableIfExists('Tenant');
}
