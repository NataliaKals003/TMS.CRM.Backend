import type { Knex } from 'knex';
import knexFactory from 'knex';
import { getSecret } from '../aws/secretsManager.js';

export interface KnexTransaction extends Knex.Transaction {}
export interface KnexQueryBuilder extends Knex.QueryBuilder {}

export interface KnexRawResponse {
  data: Record<string, any>;
  rowsAffected: number | undefined;
}

export const knexClient: Knex = connectionPool();

/** Generate knex connection */
function connectionPool(): Knex<any, unknown[]> {
  return knexFactory({
    client: 'postgresql',
    connection: loadConfigSecret,
    migrations: {
      directory: './knex/migrations',
      tableName: 'knex_migrations',
      loadExtensions: ['.mjs'],
    },
  });
}

/** Load connection config from the secret at `process.env.DATABASE_SECRET_ARN`. */
async function loadConfigSecret(): Promise<object> {
  const secret = await getSecret(process.env.DATABASE_SECRET_ARN!);

  if (!secret) {
    throw Error('Could not load database secret');
  }

  const config = JSON.parse(secret);

  const connectionString = `${config.engine}://${config.username}:${config.password}@${config.host}/${config.dbname}`;

  return {
    connectionString,
  };
}
