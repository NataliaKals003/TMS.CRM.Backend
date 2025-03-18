// Update with your config settings.

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: 'postgres-1',
      port: 5432,
      user: 'postgres',
      password: 'your_password',
      database: 'your_database_name',
    },
    migrations: {
      directory: '.knex/migrations',
    },
    seeds: {
      directory: './seeds',
    },
  },
};
