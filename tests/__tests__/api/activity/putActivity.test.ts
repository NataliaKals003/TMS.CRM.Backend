import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { APIGatewayProxyEventBuilder } from '../../../builders/apiGatewayProxyEventBuilder.js';
import { knexClient } from '../../../../lib/utils/knexClient.js';
import { randomUUID } from 'crypto';
import { activityTableName, selectActivityByExternalUuid } from '../../../../repositories/activityRepository.js';
import { ActivityEntryBuilder } from '../../../builders/activityEntryBuilder.js';
import type { PutActivityRequestPayload } from '../../../../models/api/payloads/activity.js';
import type { ActivityEntry } from '../../../../models/database/activityEntry.js';
import type { TenantEntry } from '../../../../models/database/tenantEntry.js';
import { DealProgress, RoomAccess, type DealEntry } from '../../../../models/database/dealEntry.js';
import { tenantTableName } from '../../../../repositories/tenantRepository.js';
import { TenantEntryBuilder } from '../../../builders/tenantEntryBuilder.js';
import { dealTableName } from '../../../../repositories/dealRepository.js';
import { DealEntryBuilder } from '../../../builders/dealEntryBuilder.js';
import { customerTableName } from '../../../../repositories/customerRepository.js';
import { CustomerEntryBuilder } from '../../../builders/customerEntryBuilder.js';
import type { CustomerEntry } from '../../../../models/database/customerEntry.js';
import { handler } from '../../../../lambdas/api/activity/putActivity.js';

describe('API - Activity - PUT', () => {
  const tenantsGlobal: TenantEntry[] = [];
  const customersGlobal: CustomerEntry[] = [];
  const dealsGlobal: DealEntry[] = [];
  const activitiesGlobal: ActivityEntry[] = [];

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

    const activity = await knexClient(activityTableName)
      .insert(
        ActivityEntryBuilder.make()
          .withTenantId(tenantsGlobal[0].Id)
          .withDealId(dealsGlobal[0].Id)
          .withDescription('This is a test activity')
          .withActivityImageUrl('https://www.google.com')
          .withActivityDate(new Date().toISOString())
          .build(),
      )
      .returning('*');

    activitiesGlobal.push(...activity);
  });

  it('Success - Should update a activity', async () => {
    const payload: PutActivityRequestPayload = {
      description: 'This is a test activity',
      activityImageUrl: activitiesGlobal[0].ImageUrl,
      activityDate: activitiesGlobal[0].ActivityDate,
    };

    const event = APIGatewayProxyEventBuilder.make()
      .withPathParameters({
        uuid: activitiesGlobal[0].ExternalUuid,
      })
      .withBody(payload)
      .build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(201);
    expect(res.body).toBeDefined();

    const resultData = JSON.parse(res.body!).data;
    expect(resultData.dealUuid).toBe(dealsGlobal[0].ExternalUuid);
    expect(resultData.description).toBe('This is a test activity');
    expect(resultData.activityImageUrl).toBe(payload.activityImageUrl);
    expect(new Date(resultData.activityDate).getTime()).toBeCloseTo(new Date(activitiesGlobal[0].ActivityDate).getTime());
    expect(resultData.uuid).toBeDefined();
    expect(resultData.createdOn).toBeDefined();
    expect(resultData.modifiedOn).toBeDefined();

    // Validate the database record
    const activity = await selectActivityByExternalUuid(resultData.uuid);
    expect(activity).toBeDefined();
    expect(activity!.Description).toBe(payload.description);
  });

  it('Error - Should return a 400 error if the path parameter is missing', async () => {
    const payload: PutActivityRequestPayload = {
      description: 'This is a test activity',
      activityImageUrl: activitiesGlobal[0].ImageUrl,
      activityDate: activitiesGlobal[0].ActivityDate,
    };

    // Event missing the uuid path parameter
    const event = APIGatewayProxyEventBuilder.make().withBody(payload).build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(400);
    expect(res.body).toBeDefined();

    const resultData = JSON.parse(res.body!).message;
    expect(resultData).toBe('Missing path parameters: uuid');
  });

  it('Error - Should return a 400 error if the body is missing required fields', async () => {
    // Payload missing the description
    const payload: Partial<PutActivityRequestPayload> = {
      activityImageUrl: activitiesGlobal[0].ImageUrl,
      activityDate: activitiesGlobal[0].ActivityDate,
    };

    // Event missing the uuid path parameter
    const event = APIGatewayProxyEventBuilder.make()
      .withPathParameters({
        uuid: dealsGlobal[0].ExternalUuid,
      })
      .withBody(payload)
      .build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(400);
    expect(res.body).toBeDefined();

    const resultData = JSON.parse(res.body!).message;
    expect(resultData).toBe('Missing fields: description');
  });

  it('Error - Should return a 400 error if the activity does not exist', async () => {
    const payload: PutActivityRequestPayload = {
      description: 'This is a test activity',
      activityImageUrl: 'https://www.google.com',
      activityDate: new Date().toISOString(),
    };

    // Event missing the uuid path parameter
    const event = APIGatewayProxyEventBuilder.make().withPathParameters({ uuid: randomUUID() }).withBody(payload).build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(400);
    expect(res.body).toBeDefined();

    const resultData = JSON.parse(res.body!).message;
    expect(resultData).toBe('Activity not found');
  });
});
