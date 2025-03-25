import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { APIGatewayProxyEventBuilder } from '../../../builders/apiGatewayProxyEventBuilder.js';
import { knexClient } from '../../../../lib/utils/knexClient.js';
import { randomUUID } from 'crypto';
import { handler } from '../../../../lambdas/api/customer/putCustomer.js';
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

describe('API - Activity - PUT', () => {
  const tenantsGlobal: TenantEntry[] = [];
  const dealsGlobal: DealEntry[] = [];
  const activitiesGlobal: ActivityEntry[] = [];

  beforeAll(async () => {
    const tenant = await knexClient(tenantTableName).insert(TenantEntryBuilder.make().withName('Tenant 1').build()).returning('*');

    tenantsGlobal.push(...tenant);

    const deal = await knexClient(dealTableName)
      .insert(
        DealEntryBuilder.make()
          .withTenantId(tenantsGlobal[0].Id)
          .withCustomerId('2')
          .withStreet('123 Main St')
          .withCity('New York')
          .withState('NY')
          .withZipCode('10001')
          .withRoomArea('500')
          .withPrice('1200')
          .withNumberOfPeople('2')
          .withAppointmentDate(new Date().toISOString())
          .withProgress(DealProgress.InProgress)
          .withSpecialInstructions('Handle with care')
          .withRoomAccess(RoomAccess.KeysInLockbox)
          .withDealImageUrl('https://example.com/image.jpg')
          .build(),
      )
      .returning('ExternalUuid');

    dealsGlobal.push(...deal);

    const activity = await knexClient(activityTableName)
      .insert(
        ActivityEntryBuilder.make()
          .withDealId(dealsGlobal[0].ExternalUuid)
          .withDescription('This is a test activity')
          .withActivityImageUrl('https://www.google.com')
          .withActivityDate(new Date().toISOString())
          .build(),
      )
      .returning(['Id', 'ExternalUuid', 'TenantId', 'DealId', 'Description', 'ActivityImageUrl', 'ActivityDate', 'CreatedOn', 'ModifiedOn']);

    activitiesGlobal.push(...activity);
  });

  it('Success - Should update a activity', async () => {
    const payload: PutActivityRequestPayload = {
      dealUuid: dealsGlobal[0].ExternalUuid,
      description: activitiesGlobal[0].Description,
      activityImageUrl: activitiesGlobal[0].ActivityImageUrl,
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
    expect(resultData.dealUuid).toBe(payload.dealUuid);
    expect(resultData.description).toBe(payload.description);
    expect(resultData.activityImageUrl).toBe(payload.activityImageUrl);
    expect(resultData.activityDate).toBe(payload.activityDate);
    expect(resultData.uuid).toBeDefined();
    expect(resultData.createdOn).toBeDefined();
    expect(resultData.modifiedOn).toBeDefined();

    // Validate the database record
    const activity = await selectActivityByExternalUuid(resultData.uuid);
    expect(activity).toBeDefined();
    expect(activity!.DealId).toBe(payload.dealUuid);
    expect(activity!.Description).toBe(payload.description);
    expect(activity!.ActivityImageUrl).toBe(payload.activityImageUrl);
    expect(activity!.ActivityDate).toBe(payload.activityDate);
  });

  it('Error - Should return a 400 error if the path parameter is missing', async () => {
    const payload: PutActivityRequestPayload = {
      dealUuid: dealsGlobal[0].ExternalUuid,
      description: activitiesGlobal[0].Description,
      activityImageUrl: activitiesGlobal[0].ActivityImageUrl,
      activityDate: activitiesGlobal[0].ActivityDate,
    };

    // Event missing the uuid path parameter
    const event = APIGatewayProxyEventBuilder.make().withBody(payload).build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(400);
    expect(res.body).toBeDefined();

    const resultData = JSON.parse(res.body!).errorMessage;
    expect(resultData).toBe('Missing path parameters: uuid');
  });

  it('Error - Should return a 400 error if the body is missing required fields', async () => {
    // Payload missing the email and city
    const payload: Partial<PutActivityRequestPayload> = {
      description: activitiesGlobal[0].Description,
      activityImageUrl: activitiesGlobal[0].ActivityImageUrl,
      activityDate: activitiesGlobal[0].ActivityDate,
    };

    // Event missing the uuid path parameter
    const event = APIGatewayProxyEventBuilder.make().withPathParameters(payload).withBody(payload).build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(400);
    expect(res.body).toBeDefined();

    const resultData = JSON.parse(res.body!).errorMessage;
    expect(resultData).toBe('Missing fields: email, city');
  });

  it('Error - Should return a 400 error if the activity does not exist', async () => {
    const payload: PutActivityRequestPayload = {
      dealUuid: dealsGlobal[0].ExternalUuid,
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

    const resultData = JSON.parse(res.body!).errorMessage;
    expect(resultData).toBe('Activity not found');
  });
});
