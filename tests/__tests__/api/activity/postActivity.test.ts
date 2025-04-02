import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { APIGatewayProxyEventBuilder } from '../../../builders/apiGatewayProxyEventBuilder.js';
import { handler } from '../../../../lambdas/api/activity/postActivity.js';
import { selectActivityByExternalUuid } from '../../../../repositories/activityRepository.js';
import { tenantTableName } from '../../../../repositories/tenantRepository.js';
import { TenantEntryBuilder } from '../../../builders/tenantEntryBuilder.js';
import { dealTableName } from '../../../../repositories/dealRepository.js';
import { DealEntryBuilder } from '../../../builders/dealEntryBuilder.js';
import { DealEntry, DealProgress, RoomAccess } from '../../../../models/database/dealEntry.js';
import type { TenantEntry } from '../../../../models/database/tenantEntry.js';
import { knexClient } from '../../../../lib/utils/knexClient.js';
import { CustomerEntryBuilder } from '../../../builders/customerEntryBuilder.js';
import { customerTableName } from '../../../../repositories/customerRepository.js';
import type { CustomerEntry } from '../../../../models/database/customerEntry.js';

describe('API - Activity - POST', () => {
  const tenantsGlobal: TenantEntry[] = [];
  const dealsGlobal: DealEntry[] = [];
  const customersGlobal: CustomerEntry[] = [];

  beforeAll(async () => {
    const tenant = await knexClient(tenantTableName).insert(TenantEntryBuilder.make().withName('Tenant 1').build()).returning('*');
    tenantsGlobal.push(...tenant);

    const customer = await knexClient(customerTableName)
      .insert(
        CustomerEntryBuilder.make()
          .withTenantId(tenant[0].Id)
          .withFirstName('John')
          .withLastName('Doe')
          .withEmail('john.doe@example.com')
          .withPhone('123-456-7890')
          .withStreet('123 Main St')
          .withCity('Springfield')
          .withState('IL')
          .withZipCode('62701')
          .withCustomerImageUrl('https://example.com/customer.jpg')
          .build(),
      )
      .returning('*');
    customersGlobal.push(...customer);

    const deal = await knexClient(dealTableName)
      .insert(
        DealEntryBuilder.make()
          .withTenantId(tenantsGlobal[0].Id)
          .withCustomerId(customersGlobal[0].Id)
          .withStreet('123 Main St')
          .withCity('New York')
          .withState('NY')
          .withZipCode('10001')
          .withRoomArea(500)
          .withPrice(1200)
          .withNumberOfPeople(2)
          .withAppointmentDate(new Date().toISOString())
          .withProgress(DealProgress.InProgress)
          .withSpecialInstructions('Handle with care')
          .withRoomAccess(RoomAccess.KeysInLockbox)
          .withDealImageUrl('https://example.com/image.jpg')
          .build(),
      )
      .returning('*');
    dealsGlobal.push(...deal);
  });

  it('Success - Should create a activity', async () => {
    const payload = {
      description: 'This is a test activity',
      imageUrl: 'https://www.google.com',
      date: new Date().toISOString(),
      dealUuid: dealsGlobal[0].ExternalUuid,
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

    const resultData = JSON.parse(res.body!).data;
    expect(resultData.dealUuid).toBe(payload.dealUuid);
    expect(resultData.uuid).toBeDefined();
    expect(resultData.description).toBe(payload.description);
    expect(resultData.imageUrl).toBe(payload.imageUrl);
    expect(resultData.date).toBe(payload.date);
    expect(resultData.createdOn).toBeDefined();
    expect(resultData.modifiedOn).toBeNull();

    // Validate the database record
    const activity = await selectActivityByExternalUuid(resultData.uuid);
    expect(activity).toBeDefined();
    expect(activity?.TenantId).toBe(tenantsGlobal[0].Id);
  });

  it('Error - Should return a 400 error if the body is missing required fields', async () => {
    const event = APIGatewayProxyEventBuilder.make()
      .withBody({
        description: 'This is a test activity',
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
    expect(resultData).toBe('Missing fields: date');
  });
});
