import { handler } from '../../../../lambdas/api/user/putUser.js';
import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { APIGatewayProxyEventBuilder } from '../../../builders/apiGatewayProxyEventBuilder.js';
import { selectUserByExternalUuid, userTableName } from '../../../../repositories/userRepository.js';
import { UserEntryBuilder } from '../../../builders/userEntryBuilder.js';
import type { UserEntry } from '../../../../models/database/userEntry.js';
import { knexClient } from '../../../../lib/utils/knexClient.js';
import type { PutUserRequestPayload } from '../../../../models/api/payloads/user.js';
import { randomUUID } from 'crypto';

describe('API - User - PUT', () => {
  const usersGlobal: UserEntry[] = [];

  beforeAll(async () => {
    const user = await knexClient(userTableName)
      .insert(UserEntryBuilder.make().withFirstName('John').withLastName('Doe').withEmail('john.doe@example.com').build())
      .returning(['Id', 'ExternalUuid', 'FirstName', 'LastName']);

    usersGlobal.push(...user);
  });

  it('Success - Should update a user', async () => {
    const payload: PutUserRequestPayload = {
      firstName: usersGlobal[0].FirstName,
      lastName: usersGlobal[0].LastName,
      email: 'new.john.doe@example.com',
    };

    const event = APIGatewayProxyEventBuilder.make()
      .withPathParameters({
        uuid: usersGlobal[0].ExternalUuid,
      })
      .withBody(payload)
      .build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(201);
    expect(res.body).toBeDefined();

    const resultData = JSON.parse(res.body!).data;
    expect(resultData.firstName).toBe(payload.firstName);
    expect(resultData.lastName).toBe(payload.lastName);
    expect(resultData.email).toBe(payload.email);
    expect(resultData.uuid).toBeDefined();
    expect(resultData.createdOn).toBeDefined();
    expect(resultData.modifiedOn).toBeDefined();

    // Validate the database record
    const user = await selectUserByExternalUuid(resultData.uuid);
    expect(user).toBeDefined();
    expect(user!.Email).toBe(payload.email);
  });

  it('Error - Should return a 400 error if the path parameter is missing', async () => {
    const payload: PutUserRequestPayload = {
      firstName: usersGlobal[0].FirstName,
      lastName: usersGlobal[0].LastName,
      email: 'new.john.doe@example.com',
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
    // Payload missing the email
    const payload: Partial<PutUserRequestPayload> = {
      firstName: usersGlobal[0].FirstName,
      lastName: usersGlobal[0].LastName,
    };

    // Event missing the uuid path parameter
    const event = APIGatewayProxyEventBuilder.make()
      .withBody(payload)
      .withPathParameters({
        uuid: usersGlobal[0].ExternalUuid,
      })
      .build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(400);
    expect(res.body).toBeDefined();

    const resultData = JSON.parse(res.body!).errorMessage;
    expect(resultData).toBe('Missing fields: email');
  });

  it('Error - Should return a 400 error if the user does not exist', async () => {
    const payload: PutUserRequestPayload = {
      firstName: 'Marcus',
      lastName: 'Aurelius',
      email: 'marcus.aurelius@example.com',
    };

    // Event missing the uuid path parameter
    const event = APIGatewayProxyEventBuilder.make().withPathParameters({ uuid: randomUUID() }).withBody(payload).build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(400);
    expect(res.body).toBeDefined();

    const resultData = JSON.parse(res.body!).errorMessage;
    expect(resultData).toBe('User not found');
  });
});
