import { knexClient } from '../lib/utils/knexClient.js';
import { logger } from '../lib/utils/logger.js';
import type { PaginatedResponse } from '../models/api/responses/pagination.js';
import { UserEntry } from '../models/database/userEntry.js';
import { userTenantTableName } from './userTenantRepository.js';
export const userTableName = 'User';

/** Insert the User */
export async function insertUser(user: Partial<UserEntry>): Promise<number> {
  const query = knexClient(userTableName).insert(user).returning('Id');
  const record = await query;

  logger.info(`Successfully inserted User. Id: ${record[0].Id}`);
  return record[0].Id;
}

/** Get the User by Id */
export async function selectUserById(id: number): Promise<UserEntry | null> {
  const [user] = await knexClient(userTableName).select('*').where('Id', id);

  return user ? new UserEntry(user) : null;
}

/** Get the User by ExternalUuid */
export async function selectUserByExternalUuid(externalUuid: string): Promise<UserEntry | null> {
  const [user] = await knexClient(userTableName).select('*').where('ExternalUuid', externalUuid).whereNull(`${userTableName}.DeletedOn`);

  return user ? new UserEntry(user) : null;
}

export async function selectUsers(limit: number, offset: number, tenantId: number | null): Promise<PaginatedResponse<UserEntry>> {
  // Base query without deleted users
  const baseQuery = knexClient(userTableName).whereNull(`${userTableName}.DeletedOn`);

  // If tenantId is provided, join the userTenant table and filter by tenantId
  if (tenantId) {
    baseQuery
      .innerJoin(userTenantTableName, `${userTableName}.Id`, `${userTenantTableName}.UserId`)
      .where(`${userTenantTableName}.TenantId`, tenantId);
  }

  // Get the users
  const users = await baseQuery.clone().limit(limit).offset(offset).select('*');

  // Get the total number of users
  const total = (await baseQuery.clone().count('*'))[0]['count'];

  return {
    items: users.map((user) => new UserEntry(user)),
    total: Number(total),
  };
}

/** Update the User */
export async function updateUser(userId: number, user: Partial<UserEntry>): Promise<void> {
  await knexClient(userTableName).update(user).where('Id', userId);

  logger.info(`Successfully updated User. Id: ${userId}`);
}

export async function softDeleteUserById(userId: number): Promise<void> {
  const [record] = await knexClient(userTableName).update({ DeletedOn: new Date().toISOString() }).where('Id', userId).returning('Id');

  logger.info(`Successfully soft deleted User. Id: ${record.Id}`);
}
