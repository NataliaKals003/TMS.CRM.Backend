import { knexClient } from '../lib/utils/knexClient.js';
import { logger } from '../lib/utils/logger.js';
import type { PaginatedResponse } from '../models/api/responses/pagination.js';
import { ActivityEntry } from '../models/database/activityEntry.js';
import { CustomerEntry } from '../models/database/customerEntry.js';

export const activityTableName = 'Activity';

/** Insert the activity */
export async function insertActivity(activity: Partial<ActivityEntry>): Promise<number> {
  const query = knexClient(activityTableName).insert(activity).returning('Id');
  const record = await query;

  logger.info(`Successfully inserted activity. Id: ${record[0].Id}`);
  return record[0].Id;
}

/** Get the activity by Id */
export async function selectActivityById(Id: number): Promise<ActivityEntry | null> {
  const [activity] = await knexClient(activityTableName).select('*').where('Id', Id);

  return activity ? new ActivityEntry(activity) : null;
}

/** Get the activity by ExternalUuid */
export async function selectActivityByExternalUuid(ExternalUuid: string): Promise<ActivityEntry | null> {
  const [activity] = await knexClient(activityTableName).select('*').where('ExternalUuid', ExternalUuid);

  return activity ? new ActivityEntry(activity) : null;
}

/** Get the activity by DealId */
export async function selectActivityByDealId(DealId: string): Promise<ActivityEntry | null> {
  const [activity] = await knexClient(activityTableName).select('*').where('DealId', DealId);

  return activity ? new ActivityEntry(activity) : null;
}

//get all activities

export async function selectActivities(limit: number, offset: number, dealId: number | null): Promise<PaginatedResponse<ActivityEntry>> {
  // Base query without deleted activity
  const baseQuery = knexClient(activityTableName).whereNull(`${activityTableName}.DeletedOn`);

  //If dealId is provided, filter by dealId

  if (dealId) {
    baseQuery.where(`${activityTableName}.DealId`, dealId);
  }

  // Get the activities
  const activities = await baseQuery.clone().limit(limit).offset(offset).select('*');

  // Get the total number of activities
  const total = (await baseQuery.clone().count('*'))[0]['count'];

  return {
    items: activities.map((activity) => new ActivityEntry(activity)),
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

  logger.info(`Successfully soft deleted Customer. Id: ${record.Id}`);
}
