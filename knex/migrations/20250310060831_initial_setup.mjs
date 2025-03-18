/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema
    .createTable('Tenant', (table) => {
      table.increments('Id').primary();
      table.uuid('ExternalUuid').unique().notNullable().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('Name', 50).notNullable();
      table.timestamp('CreatedOn').defaultTo(knex.fn.now()).notNullable();
      table.timestamp('ModifiedOn');
      table.timestamp('DeletedOn');
    })
    .createTable('User', (table) => {
      table.increments('Id').primary();
      table.uuid('ExternalUuid').unique().notNullable().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('FirstName', 50).notNullable();
      table.string('LastName', 50).notNullable();
      table.string('Email', 100).notNullable();
      table.timestamp('CreatedOn').defaultTo(knex.fn.now()).notNullable();
      table.timestamp('ModifiedOn');
      table.timestamp('DeletedOn');
    })
    .createTable('UserTenant', (table) => {
      table.increments('Id').primary();
      table.integer('UserId').references('Id').inTable('User').onDelete('CASCADE');
      table.integer('TenantId').references('Id').inTable('Tenant').onDelete('CASCADE');
      table.timestamp('CreatedOn').defaultTo(knex.fn.now()).notNullable();
      table.timestamp('ModifiedOn');
      table.timestamp('DeletedOn');
    })
    .createTable('Customer', (table) => {
      table.increments('Id').primary();
      table.uuid('ExternalUuid').unique().notNullable().defaultTo(knex.raw('gen_random_uuid()'));
      table.integer('TenantId').references('Id').inTable('Tenant').onDelete('CASCADE');
      table.string('FirstName', 50).notNullable();
      table.string('LastName', 50).notNullable();
      table.string('Email', 100).notNullable();
      table.string('Phone', 50);
      table.string('Street', 255).notNullable();
      table.string('City', 100).notNullable();
      table.string('State', 50).notNullable();
      table.string('Zip_code', 20).notNullable();
      table.string('ProfileImageUrl', 255);
      table.timestamp('CreatedOn').defaultTo(knex.fn.now()).notNullable();
      table.timestamp('ModifiedOn');
      table.timestamp('DeletedOn');
    })
    .createTable('Deal', (table) => {
      table.increments('Id').primary();
      table.uuid('ExternalUuid').unique().notNullable().defaultTo(knex.raw('gen_random_uuid()'));
      table.integer('TenantId').references('Id').inTable('Tenant').onDelete('CASCADE');
      table.integer('CustomerId').references('Id').inTable('Customer').onDelete('CASCADE');
      table.string('DealImageUrl', 255);
      table.string('Street', 255).notNullable();
      table.string('City', 100).notNullable();
      table.string('State', 50).notNullable();
      table.string('ZipCode', 20).notNullable();
      table.decimal('RoomArea', 8, 2);
      table.decimal('Price', 10, 2).notNullable();
      table.integer('NumberOfPeople');
      table.timestamp('AppointmentDate').notNullable();
      table.enum('Progress', ['inProgress', 'pending', 'closed']).notNullable();
      table.text('SpecialInstructions');
      table.enum('RoomAccess', ['keysWithDoorman', 'keysInLockbox', 'keysObtained', 'keysNotRequired', 'other']).notNullable();
      table.timestamp('CreatedOn').defaultTo(knex.fn.now()).notNullable();
      table.timestamp('ModifiedOn');
      table.timestamp('DeletedOn');
    })
    .createTable('Task', (table) => {
      table.increments('Id').primary();
      table.uuid('ExternalUuid').unique().notNullable().defaultTo(knex.raw('gen_random_uuid()'));
      table.integer('TenantId').references('Id').inTable('Tenant').onDelete('CASCADE');
      table.text('Description').notNullable();
      table.timestamp('DueDate').notNullable();
      table.boolean('Complete').defaultTo(false);
      table.timestamp('CreatedOn').defaultTo(knex.fn.now()).notNullable();
      table.timestamp('ModifiedOn');
      table.timestamp('DeletedOn');
    })
    .createTable('Activity', (table) => {
      table.increments('Id').primary();
      table.uuid('ExternalUuid').unique().notNullable().defaultTo(knex.raw('gen_random_uuid()'));
      table.integer('TenantId').references('Id').inTable('Tenant').onDelete('CASCADE');
      table.integer('DealId').references('Id').inTable('Deal').onDelete('CASCADE');
      table.text('Description');
      table.timestamp('ActivityDate').notNullable();
      table.string('ActivityImageUrl', 255);
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
  await knex.schema
    .dropTableIfExists('UserTenant')
    .dropTableIfExists('User')
    .dropTableIfExists('Tenant')
    .dropTableIfExists('Activity')
    .dropTableIfExists('Task')
    .dropTableIfExists('Deal')
    .dropTableIfExists('Customer');
}
