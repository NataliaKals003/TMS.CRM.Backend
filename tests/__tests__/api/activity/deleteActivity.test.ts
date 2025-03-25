import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { APIGatewayProxyEventBuilder } from '../../../builders/apiGatewayProxyEventBuilder.js';
import { knexClient } from '../../../../lib/utils/knexClient.js';
import { randomUUID } from 'crypto';
import type { ActivityEntry } from '../../../../models/database/activityEntry.js';
import { activityTableName, selectActivityByExternalUuid } from '../../../../repositories/activityRepository.js';
import { ActivityEntryBuilder } from '../../../builders/activityEntryBuilder.js';
import { handler } from '../../../../lambdas/api/activity/deleteActivity.js';

describe('API - Activity - DELETE', () => {
  const activitiesGlobal: ActivityEntry[] = [];

  beforeAll(async () => {
    const activity = await knexClient(activityTableName)
      .insert(
        ActivityEntryBuilder.make()
          .withDescription('Sample activity description')
          .withActivityDate(new Date().toISOString())
          .withActivityImageUrl('http://example.com/profile.jpg')
          .build(),
      )
      .returning('*');

    activitiesGlobal.push(...activity);
  });

  it('Success - Should delete a activity', async () => {
    const event = APIGatewayProxyEventBuilder.make()
      .withPathParameters({
        uuid: activitiesGlobal[0].ExternalUuid,
      })
      .build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(204);
    expect(res.body).toBeDefined();

    // Validate the database record
    const activity = await selectActivityByExternalUuid(activitiesGlobal[0].ExternalUuid);
    expect(activity?.DeletedOn).toBeDefined();
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

  it('Error - Should return a 400 error if the activity does not exist', async () => {
    // Event missing the uuid path parameter
    const event = APIGatewayProxyEventBuilder.make().withPathParameters({ uuid: randomUUID() }).build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(400);
    expect(res.body).toBeDefined();

    const resultData = JSON.parse(res.body!).errorMessage;
    expect(resultData).toBe('Activity not found');
  });
});
