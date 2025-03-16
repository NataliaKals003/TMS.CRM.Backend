import { knexClient } from '../lib/utils/knexClient.js';
import { logger } from '../lib/utils/logger.js';
import type { UserTenantEntry } from '../models/database/userTenantEntry.js';

export const userTenantTableName = 'UserTenant';

/** Insert the UserTenant */
export async function insertUserTenant(userTenant: Partial<UserTenantEntry>): Promise<number> {
  const query = knexClient(userTenantTableName).insert(userTenant).returning('Id');
  const record = await query;

  logger.info(`Successfully inserted UserTenant. Id: ${record[0].Id}`);
  return record[0].Id;
}
