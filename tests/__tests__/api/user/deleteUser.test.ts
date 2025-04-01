import { handler } from '../../../../lambdas/api/user/deleteUser.js';
import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { APIGatewayProxyEventBuilder } from '../../../builders/apiGatewayProxyEventBuilder.js';
import { selectUserByExternalUuid, userTableName } from '../../../../repositories/userRepository.js';
import { UserEntryBuilder } from '../../../builders/userEntryBuilder.js';
import type { UserEntry } from '../../../../models/database/userEntry.js';
import { knexClient } from '../../../../lib/utils/knexClient.js';
import type { PutUserRequestPayload } from '../../../../models/api/payloads/user.js';
import { randomUUID } from 'crypto';

describe('API - User - DELETE', () => {
  const usersGlobal: UserEntry[] = [];

  beforeAll(async () => {
    const user = await knexClient(userTableName)
      .insert(UserEntryBuilder.make().withFirstName('John').withLastName('Doe').withEmail('john.doe@example.com').build())
      .returning('*');

    usersGlobal.push(...user);
  });

  it('Success - Should delete a user', async () => {
    const event = APIGatewayProxyEventBuilder.make()
      .withPathParameters({
        uuid: usersGlobal[0].ExternalUuid,
      })
      .build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(204);
    expect(res.body).toBeDefined();

    // Validate the database record
    const user = await selectUserByExternalUuid(usersGlobal[0].ExternalUuid);
    expect(user?.DeletedOn).toBeDefined();
  });

  it('Error - Should return a 400 error if the path parameter is missing', async () => {
    const event = APIGatewayProxyEventBuilder.make().build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(400);
    expect(res.body).toBeDefined();

    const resultData = JSON.parse(res.body!).message;
    expect(resultData).toBe('Missing path parameters: uuid');
  });

  it('Error - Should return a 400 error if the user does not exist', async () => {
    // Event missing the uuid path parameter
    const event = APIGatewayProxyEventBuilder.make().withPathParameters({ uuid: randomUUID() }).build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(400);
    expect(res.body).toBeDefined();

    const resultData = JSON.parse(res.body!).message;
    expect(resultData).toBe('User not found');
  });
});
