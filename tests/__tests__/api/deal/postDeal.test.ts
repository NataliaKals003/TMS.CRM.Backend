import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { APIGatewayProxyEventBuilder } from '../../../builders/apiGatewayProxyEventBuilder.js';
import { selectDealByExternalUuid } from '../../../../repositories/dealRepository.js';
import { handler } from '../../../../lambdas/api/deal/postDeal.js';
import type { CustomerEntry } from '../../../../models/database/customerEntry.js';
import { knexClient } from '../../../../lib/utils/knexClient.js';
import { CustomerEntryBuilder } from '../../../builders/customerEntryBuilder.js';
import { customerTableName } from '../../../../repositories/customerRepository.js';
import { DealProgress, RoomAccess } from '../../../../models/database/dealEntry.js';
import { tenantTableName } from '../../../../repositories/tenantRepository.js';
import { TenantEntryBuilder } from '../../../builders/tenantEntryBuilder.js';
import type { TenantEntry } from '../../../../models/database/tenantEntry.js';
import type { PostDealResponsePayload } from '../../../../models/api/payloads/deal.js';

describe('API - Deal - POST', () => {
  const tenantsGlobal: TenantEntry[] = [];
  const customersGlobal: CustomerEntry[] = [];

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
  });

  it('Success - Should create a deal', async () => {
    const payload = {
      customerUuid: customersGlobal[0].ExternalUuid,
      price: 100,
      street: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zipCode: '12345',
      roomArea: 50,
      numberOfPeople: 2,
      appointmentDate: new Date().toISOString(),
      progress: DealProgress.InProgress,
      specialInstructions: 'Handle with care',
      roomAccess: RoomAccess.KeysInLockbox,
      imageUrl: 'https://example.com/image.jpg',
    };

    const event = APIGatewayProxyEventBuilder.make()
      .withBody(payload)
      .withQueryStringParameters({
        tenantId: tenantsGlobal[0].Id.toString(),
      })
      .build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(201);
    expect(res.body).toBeDefined();

    const resultData = JSON.parse(res.body!).data as PostDealResponsePayload;
    expect(resultData.customer.uuid).toBe(customersGlobal[0].ExternalUuid);
    expect(resultData.customer.imageUrl).toBe(customersGlobal[0].ImageUrl);
    expect(resultData.customer.firstName).toBe(customersGlobal[0].FirstName);
    expect(resultData.customer.lastName).toBe(customersGlobal[0].LastName);
    expect(resultData.customer.email).toBe(customersGlobal[0].Email);
    expect(resultData.customer.phone).toBe(customersGlobal[0].Phone);
    expect(resultData.street).toBe('123 Main St');
    expect(resultData.city).toBe('Anytown');
    expect(resultData.state).toBe('CA');
    expect(resultData.zipCode).toBe('12345');
    expect(resultData.roomArea).toBeCloseTo(50);
    expect(resultData.price).toBeCloseTo(100);
    expect(resultData.numberOfPeople).toBe(2);
    expect(new Date(resultData.appointmentDate).getTime()).toBeCloseTo(new Date(payload.appointmentDate).getTime());
    expect(resultData.progress).toBe(DealProgress.InProgress);
    expect(resultData.specialInstructions).toBe('Handle with care');
    expect(resultData.roomAccess).toBe(RoomAccess.KeysInLockbox);
    expect(resultData.imageUrl).toBe('https://example.com/image.jpg');
    expect(resultData.uuid).toBeDefined();
    expect(resultData.createdOn).toBeDefined();
    expect(resultData.modifiedOn).toBeNull();

    // Validate the database record
    const deal = await selectDealByExternalUuid(resultData.uuid);
    expect(deal).toBeDefined();
    expect(deal?.TenantId).toBe(tenantsGlobal[0].Id);
  });

  it('Error - Should return a 400 error if the body is missing required fields', async () => {
    const event = APIGatewayProxyEventBuilder.make()
      .withBody({
        price: '1000000',
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        customerUuid: '12345678-1234-1234-1234-123456789012',
      })
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
    expect(resultData).toBe('Missing fields: zipCode, roomArea, numberOfPeople, appointmentDate, progress, roomAccess');
  });
});
