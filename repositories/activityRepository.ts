import { knexClient } from '../lib/utils/knexClient.js';
import { logger } from '../lib/utils/logger.js';
import type { PaginatedResponse } from '../models/api/responses/pagination.js';
import { ActivityEntry, ExtendedActivityEntry } from '../models/database/activityEntry.js';
import { dealTableName } from './dealRepository.js';

export const activityTableName = 'Activity';

/** Insert the activity */
export async function insertActivity(activity: Partial<ActivityEntry>): Promise<number> {
  const query = knexClient(activityTableName).insert(activity).returning('Id');
  const record = await query;

  logger.info(`Successfully inserted activity. Id: ${record[0].Id}`);
  return record[0].Id;
}

/** Get the activity by Id */
export async function selectActivityById(id: number): Promise<ExtendedActivityEntry | null> {
  const [activity] = await knexClient(activityTableName)
    .select(`${activityTableName}.*`, `${dealTableName}.ExternalUuid as DealExternalUuid`)
    .innerJoin(dealTableName, `${activityTableName}.DealId`, '=', `${dealTableName}.Id`)
    .where(`${activityTableName}.Id`, id);

  return activity ? new ExtendedActivityEntry(activity) : null;
}

/** Get the activity by ExternalUuid */
export async function selectActivityByExternalUuid(externalUuid: string): Promise<ExtendedActivityEntry | null> {
  const [activity] = await knexClient(activityTableName)
    .select(`${activityTableName}.*`, `${dealTableName}.ExternalUuid as DealExternalUuid`)
    .innerJoin(dealTableName, `${activityTableName}.DealId`, '=', `${dealTableName}.Id`)
    .where(`${activityTableName}.ExternalUuid`, externalUuid);

  return activity ? new ExtendedActivityEntry(activity) : null;
}

export async function selectActivities(limit: number, offset: number, tenantId: number | null): Promise<PaginatedResponse<ExtendedActivityEntry>> {
  const baseQuery = knexClient(activityTableName).whereNull(`${activityTableName}.DeletedOn`);

  // If tenantId is provided, join the activityTableName table and filter by tenantId
  if (tenantId) {
    baseQuery.where(`${activityTableName}.TenantId`, tenantId);
  }

  // Get the activities
  const activities = await baseQuery.clone().limit(limit).offset(offset).select('*');

  // Get the total number of activities
  const total = (await baseQuery.clone().count('*'))[0]['count'];

  return {
    items: activities.map((activity) => new ExtendedActivityEntry(activity)),
    total: Number(total),
  };
}

/** Update the activity */
export async function updateActivity(activityId: number, activity: Partial<ActivityEntry>): Promise<void> {
  await knexClient(activityTableName).update(activity).where('Id', activityId);

  logger.info(`Successfully updated activity. Id: ${activityId}`);
}

//**Delete activity */
export async function softDeleteActivityById(activityId: number): Promise<void> {
  const [record] = await knexClient(activityTableName).update({ DeletedOn: new Date().toISOString() }).where('Id', activityId).returning('Id');

  logger.info(`Successfully soft deleted Activity. Id: ${record.Id}`);
}
