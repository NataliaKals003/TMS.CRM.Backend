import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { APIGatewayProxyEventBuilder } from '../../../builders/apiGatewayProxyEventBuilder.js';
import { knexClient } from '../../../../lib/utils/knexClient.js';
import { randomUUID } from 'crypto';
import type { TenantEntry } from '../../../../models/database/tenantEntry.js';
import { tenantTableName } from '../../../../repositories/tenantRepository.js';
import { TenantEntryBuilder } from '../../../builders/tenantEntryBuilder.js';
import type { CustomerEntry } from '../../../../models/database/customerEntry.js';
import { customerTableName } from '../../../../repositories/customerRepository.js';
import { CustomerEntryBuilder } from '../../../builders/customerEntryBuilder.js';
import { DealEntryBuilder } from '../../../builders/dealEntryBuilder.js';
import { dealTableName } from '../../../../repositories/dealRepository.js';
import { DealEntry, DealProgress, RoomAccess } from '../../../../models/database/dealEntry.js';
import { handler } from '../../../../lambdas/api/deal/getDeal.js';

describe('API - Deal - GET', () => {
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
      .returning('Id');

    customersGlobal.push(...customer);

    const deal = await knexClient(dealTableName)
      .insert([
        DealEntryBuilder.make()
          .withTenantId(tenantsGlobal[0].Id)
          .withCustomerId(String(customersGlobal[0].Id))
          .withPrice('100')
          .withStreet('202/3 Rose Garden Lane')
          .withCity('Auckland')
          .withState('Auckland Region')
          .withZipCode('0632')
          .withDealImageUrl('http/1234')
          .withRoomArea('100')
          .withNumberOfPeople('2')
          .withAppointmentDate(new Date().toISOString())
          .withProgress(DealProgress.InProgress)
          .withRoomAccess(RoomAccess.KeysWithDoorman)
          .withSpecialInstructions('Special Instructions')
          .build(),
      ])

      .returning('*');
    dealsGlobal.push(...deal);
  });

  it('Success - Should get a deal', async () => {
    const event = APIGatewayProxyEventBuilder.make()
      .withPathParameters({
        uuid: dealsGlobal[0].ExternalUuid,
      })
      .build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(200);
    expect(res.body).toBeDefined();

    const resultData = JSON.parse(res.body!).data;
    expect(resultData.customerId).toBe(customersGlobal[0].Id);
    expect(resultData.street).toBe(dealsGlobal[0].Street);
    expect(resultData.city).toBe(dealsGlobal[0].City);
    expect(resultData.state).toBe(dealsGlobal[0].State);
    expect(resultData.zipCode).toBe(dealsGlobal[0].ZipCode);
    expect(resultData.dealImageUrl).toBe(dealsGlobal[0].DealImageUrl);
    expect(resultData.roomArea).toBe(dealsGlobal[0].RoomArea);
    expect(resultData.price).toBe(dealsGlobal[0].Price);
    expect(resultData.numberOfPeople).toBe(dealsGlobal[0].NumberOfPeople);
    expect(resultData.appointmentDate).toBe(dealsGlobal[0].AppointmentDate);
    expect(resultData.progress).toBe(dealsGlobal[0].Progress);
    expect(resultData.roomAccess).toBe(dealsGlobal[0].RoomAccess);
    expect(resultData.specialInstructions).toBe(dealsGlobal[0].SpecialInstructions);
    expect(resultData.uuid).toBeDefined();
    expect(resultData.createdOn).toBeDefined();
    expect(resultData.modifiedOn).toBeDefined();
  });

  it('Error - Should return a 400 error if the path parameter is missing', async () => {
    // Event missing the uuid path parameter
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
    // Event with a random uuid on the path parameter
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
