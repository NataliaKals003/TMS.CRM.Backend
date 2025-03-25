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
      .returning(['Id, ExternalUuid, FirstName, LastName, Email, Phone, Street, City, State, ZipCode, CustomerImageUrl']);

    customersGlobal.push(...customer);
  });

  it('Success - Should create a deal', async () => {
    const payload = {
      customerUuid: customersGlobal[0].Id,
      price: '1000000',
      street: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zipCode: '12345',
      roomArea: '500',
      numberOfPeople: '2',
      appointmentDate: new Date().toISOString(),
      progress: DealProgress.InProgress,
      specialInstructions: 'Handle with care',
      roomAccess: RoomAccess.KeysInLockbox,
      dealImageUrl: 'https://example.com/image.jpg',
    };

    const event = APIGatewayProxyEventBuilder.make().withBody(payload).build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(201);
    expect(res.body).toBeDefined();

    const resultData = JSON.parse(res.body!).data;
    expect(resultData.uuid).toBeDefined();
    expect(resultData.customerId).toBe(payload.customerUuid);
    expect(resultData.price).toBe(payload.price);
    expect(resultData.street).toBe(payload.street);
    expect(resultData.city).toBe(payload.city);
    expect(resultData.state).toBe(payload.state);
    expect(resultData.zipCode).toBe(payload.zipCode);
    expect(resultData.roomArea).toBe(payload.roomArea);
    expect(resultData.numberOfPeople).toBe(payload.numberOfPeople);
    expect(resultData.appointmentDate).toBe(payload.appointmentDate);
    expect(resultData.progress).toBe(payload.progress);
    expect(resultData.specialInstructions).toBe(payload.specialInstructions);
    expect(resultData.roomAccess).toBe(payload.roomAccess);
    expect(resultData.dealImageUrl).toBe(payload.dealImageUrl);
    expect(resultData.createdOn).toBeDefined();
    expect(resultData.modifiedOn).toBeNull();

    // Validate the database record
    const deal = await selectDealByExternalUuid(resultData.uuid);
    expect(deal).toBeDefined();
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
      .build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(400);
    expect(res.body).toBeDefined();

    const resultData = JSON.parse(res.body!).errorMessage;
    expect(resultData).toBe(
      'Missing fields: zipCode, roomArea, numberOfPeople, appointmentDate, progress, specialInstructions, roomAccess, dealImageUrl',
    );
  });
});
