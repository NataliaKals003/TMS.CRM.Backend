import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { APIGatewayProxyEventBuilder } from '../../../builders/apiGatewayProxyEventBuilder.js';
import { knexClient } from '../../../../lib/utils/knexClient.js';
import { randomUUID } from 'crypto';
import type { CustomerEntry } from '../../../../models/database/customerEntry.js';
import { customerTableName } from '../../../../repositories/customerRepository.js';
import { CustomerEntryBuilder } from '../../../builders/customerEntryBuilder.js';
import { DealProgress, RoomAccess, type DealEntry } from '../../../../models/database/dealEntry.js';
import { dealTableName, selectDealByExternalUuid } from '../../../../repositories/dealRepository.js';
import { DealEntryBuilder } from '../../../builders/dealEntryBuilder.js';
import type { TenantEntry } from '../../../../models/database/tenantEntry.js';
import { tenantTableName } from '../../../../repositories/tenantRepository.js';
import { TenantEntryBuilder } from '../../../builders/tenantEntryBuilder.js';
import { handler } from '../../../../lambdas/api/deal/deleteDeal.js';

describe('API - Deal - DELETE', () => {
  const tenantsGlobal: TenantEntry[] = [];
  const customersGlobal: CustomerEntry[] = [];
  const dealsGlobal: DealEntry[] = [];

  beforeAll(async () => {
    const tenant = await knexClient(tenantTableName).insert(TenantEntryBuilder.make().withName('Tenant 1').build()).returning('*');

    tenantsGlobal.push(...tenant);

    const customer = await knexClient(customerTableName)
      .insert([
        CustomerEntryBuilder.make()
          .withTenantId(tenantsGlobal[0].Id)
          .withFirstName('John')
          .withLastName('Doe')
          .withEmail('john.doe@example.com')
          .withPhone('642103273576')
          .withStreet('202/3 Rose Garden Lane')
          .withCity('Auckland')
          .withState('Auckland Region')
          .withZipCode('0632')
          .withCustomerImageUrl('http/1234')
          .build(),
      ])
      .returning('*');

    customersGlobal.push(...customer);

    const deal = await knexClient(dealTableName)
      .insert(
        DealEntryBuilder.make()
          .withCustomerId(customersGlobal[0].Id)
          .withPrice(100)
          .withStreet('202/3 Rose Garden Lane')
          .withCity('Auckland')
          .withState('Auckland Region')
          .withZipCode('0632')
          .withDealImageUrl('http/1234')
          .withRoomArea(100)
          .withNumberOfPeople(2)
          .withAppointmentDate(new Date().toISOString())
          .withProgress(DealProgress.InProgress)
          .withRoomAccess(RoomAccess.KeysWithDoorman)
          .withSpecialInstructions('Special instructions')
          .build(),
      )
      .returning('*');

    dealsGlobal.push(...deal);
  });

  it('Success - Should delete a deal', async () => {
    const event = APIGatewayProxyEventBuilder.make()
      .withPathParameters({
        uuid: dealsGlobal[0].ExternalUuid,
      })
      .build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(204);
    expect(res.body).toBeDefined();

    // Validate the database record
    const deal = await selectDealByExternalUuid(dealsGlobal[0].ExternalUuid);
    expect(deal?.DeletedOn).toBeDefined();
  });

  it('Error - Should return a 400 error if the path parameter is missing', async () => {
    const event = APIGatewayProxyEventBuilder.make().build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(400);
    expect(res.body).toBeDefined();

    const resultData = JSON.parse(res.body!).errorMessage;
    expect(resultData).toBe('Missing path parameters: uuid');
  });

  it('Error - Should return a 400 error if the deal does not exist', async () => {
    // Event missing the uuid path parameter
    const event = APIGatewayProxyEventBuilder.make().withPathParameters({ uuid: randomUUID() }).build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(400);
    expect(res.body).toBeDefined();

    const resultData = JSON.parse(res.body!).errorMessage;
    expect(resultData).toBe('Deal not found');
  });
});
