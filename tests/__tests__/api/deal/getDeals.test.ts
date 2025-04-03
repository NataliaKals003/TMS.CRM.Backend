import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { APIGatewayProxyEventBuilder } from '../../../builders/apiGatewayProxyEventBuilder.js';
import { knexClient } from '../../../../lib/utils/knexClient.js';
import type { TenantEntry } from '../../../../models/database/tenantEntry.js';
import { tenantTableName } from '../../../../repositories/tenantRepository.js';
import { TenantEntryBuilder } from '../../../builders/tenantEntryBuilder.js';
import { customerTableName } from '../../../../repositories/customerRepository.js';
import { CustomerEntryBuilder } from '../../../builders/customerEntryBuilder.js';
import type { CustomerEntry } from '../../../../models/database/customerEntry.js';
import { DealProgress, RoomAccess } from '../../../../models/database/dealEntry.js';
import { DealEntryBuilder } from '../../../builders/dealEntryBuilder.js';
import { dealTableName } from '../../../../repositories/dealRepository.js';
import { handler } from '../../../../lambdas/api/deal/getDeals.js';

describe('API - Deals - GET', () => {
  const tenantsGlobal: TenantEntry[] = [];
  const customersGlobal: CustomerEntry[] = [];

  beforeAll(async () => {
    const tenant = await knexClient(tenantTableName)
      .insert([TenantEntryBuilder.make().withName('Tenant 1').build(), TenantEntryBuilder.make().withName('Tenant 2').build()])
      .returning('*');
    tenantsGlobal.push(...tenant);

    const customer = await knexClient(customerTableName)
      .insert([
        CustomerEntryBuilder.make()
          .withTenantId(tenantsGlobal[0].Id)
          .withFirstName('John')
          .withLastName('Doe')
          .withEmail('john.doe@example.com')
          .withPhone('642103273577')
          .withStreet('101 Elm Street')
          .withCity('Wellington')
          .withState('Wellington Region')
          .withZipCode('6011')
          .withCustomerImageUrl('http/5678')
          .build(),

        CustomerEntryBuilder.make()
          .withTenantId(tenantsGlobal[0].Id)
          .withFirstName('Jane')
          .withLastName('Smith')
          .withEmail('jane.smith@example.com')
          .withPhone('642103273578')
          .withStreet('202 Oak Avenue')
          .withCity('Auckland')
          .withState('Auckland Region')
          .withZipCode('1010')
          .withCustomerImageUrl('http/6789')
          .build(),

        CustomerEntryBuilder.make()
          .withTenantId(tenantsGlobal[0].Id)
          .withFirstName('Sofi')
          .withLastName('Smith')
          .withEmail('sofi.smith@example.com')
          .withPhone('642103273578')
          .withStreet('202 Oak Avenue')
          .withCity('Auckland')
          .withState('Auckland Region')
          .withZipCode('1010')
          .withCustomerImageUrl('http/6789')
          .build(),
      ])
      .returning('*');
    customersGlobal.push(...customer);

    const deal = await knexClient(dealTableName)
      .insert([
        DealEntryBuilder.make()
          .withTenantId(tenantsGlobal[0].Id)
          .withCustomerId(customersGlobal[0].Id)
          .withPrice(150)
          .withStreet('202 Pine Street')
          .withCity('Auckland')
          .withState('Auckland Region')
          .withZipCode('1010')
          .withDealImageUrl('http/1234')
          .withRoomArea(120)
          .withNumberOfPeople(3)
          .withAppointmentDate(new Date().toISOString())
          .withProgress(DealProgress.Closed)
          .withRoomAccess(RoomAccess.KeysWithDoorman)
          .build(),

        DealEntryBuilder.make()
          .withTenantId(tenantsGlobal[0].Id)
          .withCustomerId(customersGlobal[0].Id)
          .withPrice(200)
          .withStreet('303 Oak Street')
          .withCity('Christchurch')
          .withState('Canterbury Region')
          .withZipCode('8011')
          .withDealImageUrl('http/2345')
          .withRoomArea(140)
          .withNumberOfPeople(4)
          .withAppointmentDate(new Date().toISOString())
          .withProgress(DealProgress.InProgress)
          .withRoomAccess(RoomAccess.KeysWithDoorman)
          .build(),

        DealEntryBuilder.make()
          .withTenantId(tenantsGlobal[0].Id)
          .withCustomerId(customersGlobal[0].Id)
          .withPrice(250)
          .withStreet('404 Maple Street')
          .withCity('Hamilton')
          .withState('Waikato Region')
          .withZipCode('3204')
          .withDealImageUrl('http/3456')
          .withRoomArea(160)
          .withNumberOfPeople(5)
          .withAppointmentDate(new Date().toISOString())
          .withProgress(DealProgress.Pending)
          .withRoomAccess(RoomAccess.KeysWithDoorman)
          .build(),

        DealEntryBuilder.make()
          .withTenantId(tenantsGlobal[0].Id)
          .withCustomerId(customersGlobal[0].Id)
          .withPrice(300)
          .withStreet('505 Birch Street')
          .withCity('Dunedin')
          .withState('Otago Region')
          .withZipCode('9016')
          .withDealImageUrl('http/4567')
          .withRoomArea(180)
          .withNumberOfPeople(6)
          .withAppointmentDate(new Date().toISOString())
          .withProgress(DealProgress.InProgress)
          .withRoomAccess(RoomAccess.KeysWithDoorman)
          .build(),

        DealEntryBuilder.make()
          .withTenantId(tenantsGlobal[0].Id)
          .withCustomerId(customersGlobal[0].Id)
          .withPrice(350)
          .withStreet('606 Cedar Street')
          .withCity('Tauranga')
          .withState('Bay of Plenty Region')
          .withZipCode('3110')
          .withDealImageUrl('http/5678')
          .withRoomArea(200)
          .withNumberOfPeople(7)
          .withAppointmentDate(new Date().toISOString())
          .withProgress(DealProgress.InProgress)
          .withRoomAccess(RoomAccess.KeysWithDoorman)
          .build(),

        DealEntryBuilder.make()
          .withTenantId(tenantsGlobal[0].Id)
          .withCustomerId(customersGlobal[0].Id)
          .withPrice(400)
          .withStreet('707 Walnut Street')
          .withCity('Napier')
          .withState("Hawke's Bay Region")
          .withZipCode('4110')
          .withDealImageUrl('http/6789')
          .withRoomArea(220)
          .withNumberOfPeople(8)
          .withAppointmentDate(new Date().toISOString())
          .withProgress(DealProgress.Pending)
          .withRoomAccess(RoomAccess.KeysWithDoorman)
          .build(),
      ])
      .returning('Id');

    // Insert a second deal
    await knexClient(dealTableName)
      .insert([
        DealEntryBuilder.make()
          .withTenantId(tenantsGlobal[0].Id)
          .withCustomerId(customersGlobal[1].Id)
          .withPrice(500)
          .withStreet('808 Spruce Street')
          .withCity('Queenstown')
          .withState('Otago Region')
          .withZipCode('9300')
          .withDealImageUrl('http/7890')
          .withRoomArea(250)
          .withNumberOfPeople(10)
          .withAppointmentDate(new Date().toISOString())
          .withProgress(DealProgress.Closed)
          .withRoomAccess(RoomAccess.KeysWithDoorman)
          .build(),
      ])
      .returning('Id');
  });

  it('Success - Should get deals with pagination', async () => {
    const event = APIGatewayProxyEventBuilder.make()
      .withQueryStringParameters({
        limit: '5',
        offset: '0',
        tenantId: tenantsGlobal[0].Id.toString(), // TODO: Remove once the tenant is pulled from the token
      })
      .build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(200);
    expect(res.body).toBeDefined();

    const resultData = JSON.parse(res.body!).data;
    expect(resultData.items).toBeDefined();
    expect(resultData.items.length).toBe(5);
    expect(resultData.total).toBe(7);
  });

  it('Success - Should get deals with pagination using offset', async () => {
    const event = APIGatewayProxyEventBuilder.make()
      .withQueryStringParameters({
        limit: '5',
        offset: '5',
        tenantId: tenantsGlobal[0].Id.toString(), // TODO: Remove once the tenant is pulled from the token
      })
      .build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(200);
    expect(res.body).toBeDefined();

    const resultData = JSON.parse(res.body!).data;
    expect(resultData.items).toBeDefined();
    expect(resultData.items.length).toBe(2); // Exclude the first 5 deals
    expect(resultData.total).toBe(7); // Total number of deals should still be 6
  });

  it('Success - Should return 0 deals if the tenant has no deals', async () => {
    const event = APIGatewayProxyEventBuilder.make()
      .withQueryStringParameters({
        limit: '5',
        offset: '0',
        tenantId: tenantsGlobal[1].Id.toString(), // TODO: Remove once the tenant is pulled from the token
      })
      .build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(200);
    expect(res.body).toBeDefined();

    const resultData = JSON.parse(res.body!).data;
    expect(resultData.items).toBeDefined();
    expect(resultData.items.length).toBe(0);
    expect(resultData.total).toBe(0);
  });

  it('Error - Should return a 400 error if the query parameters are missing', async () => {
    // Event missing the uuid path parameter
    const event = APIGatewayProxyEventBuilder.make()
      .withQueryStringParameters({
        tenantId: tenantsGlobal[0].Id.toString(),
      })
      .build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(400);
    expect(res.body).toBeDefined();

    const resultData = JSON.parse(res.body!).message;
    expect(resultData).toContain('Missing required query parameters: limit, offset');
  });
});
