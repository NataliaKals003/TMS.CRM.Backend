import { knexClient } from '../lib/utils/knexClient.js';
import { logger } from '../lib/utils/logger.js';
import type { PaginatedResponse } from '../models/api/responses/pagination.js';
import { DealEntry, ExtendedDealEntry } from '../models/database/dealEntry.js';
import { customerTableName } from './customerRepository.js';

export const dealTableName = 'Deal';

/** Insert the Deal */
export async function insertDeal(deal: Partial<DealEntry>): Promise<number> {
  const query = knexClient(dealTableName).insert(deal).returning('Id');
  const record = await query;

  logger.info(`Successfully inserted Deal. Id: ${record[0].Id}`);
  return record[0].Id;
}

/** Get the Deal by Id */
export async function selectDealById(id: number): Promise<ExtendedDealEntry | null> {
  const [deal] = await knexClient(dealTableName)
    .select(
      `${dealTableName}.*`,
      `${customerTableName}.ExternalUuid as CustomerExternalUuid`,
      `${customerTableName}.ImageUrl as CustomerImageUrl`,
      `${customerTableName}.FirstName as CustomerFirstName`,
      `${customerTableName}.LastName as CustomerLastName`,
      `${customerTableName}.Email as CustomerEmail`,
      `${customerTableName}.Phone as CustomerPhone`,
    )
    .innerJoin(customerTableName, `${dealTableName}.CustomerId`, '=', `${customerTableName}.Id`)
    .where(`${dealTableName}.Id`, id)
    .whereNull(`${dealTableName}.DeletedOn`)
    .whereNull(`${customerTableName}.DeletedOn`);

  return deal ? new ExtendedDealEntry(deal) : null;
}

/** Get the Deal by ExternalUuid */
export async function selectDealByExternalUuid(externalUuid: string): Promise<ExtendedDealEntry | null> {
  const [deal] = await knexClient(dealTableName)
    .select(
      `${dealTableName}.*`,
      `${customerTableName}.ExternalUuid as CustomerExternalUuid`,
      `${customerTableName}.ImageUrl as CustomerImageUrl`,
      `${customerTableName}.FirstName as CustomerFirstName`,
      `${customerTableName}.LastName as CustomerLastName`,
      `${customerTableName}.Email as CustomerEmail`,
      `${customerTableName}.Phone as CustomerPhone`,
    )
    .innerJoin(customerTableName, `${dealTableName}.CustomerId`, '=', `${customerTableName}.Id`)
    .where(`${dealTableName}.ExternalUuid`, externalUuid)
    .whereNull(`${dealTableName}.DeletedOn`);

  return deal ? new ExtendedDealEntry(deal) : null;
}

export async function selectDeals(limit: number, offset: number, tenantId: number | null): Promise<PaginatedResponse<ExtendedDealEntry>> {
  // Base query without deleted deals
  const baseQuery = knexClient(dealTableName)
    .whereNull(`${dealTableName}.DeletedOn`)
    .innerJoin(customerTableName, `${dealTableName}.CustomerId`, '=', `${customerTableName}.Id`)
    .whereNull(`${customerTableName}.DeletedOn`);

  // If tenantId is provided, filter by tenantId
  if (tenantId) {
    baseQuery.where(`${dealTableName}.TenantId`, tenantId);
  }

  // Get the deals
  const deals = await baseQuery
    .clone()
    .limit(limit)
    .offset(offset)
    .select(
      `${dealTableName}.*`,
      `${customerTableName}.ExternalUuid as CustomerExternalUuid`,
      `${customerTableName}.ImageUrl as CustomerImageUrl`,
      `${customerTableName}.FirstName as CustomerFirstName`,
      `${customerTableName}.LastName as CustomerLastName`,
      `${customerTableName}.Email as CustomerEmail`,
      `${customerTableName}.Phone as CustomerPhone`,
    );

  // Get the total number of deals
  const total = (await baseQuery.clone().count('*'))[0]['count'];

  return {
    items: deals.map((deal) => new ExtendedDealEntry(deal)),
    total: Number(total),
  };
}

/** Update the Deal */
export async function updateDeal(dealId: number, deal: Partial<DealEntry>): Promise<void> {
  await knexClient(dealTableName).update(deal).where('Id', dealId);

  logger.info(`Successfully updated User. Id: ${dealId}`);
}

/** Delete the Deal */
export async function softDeleteDealById(dealId: number): Promise<void> {
  const [record] = await knexClient(dealTableName).update({ DeletedOn: new Date().toISOString() }).where('Id', dealId).returning('Id');

  logger.info(`Successfully soft deleted Deal. Id: ${record.Id}`);
}
