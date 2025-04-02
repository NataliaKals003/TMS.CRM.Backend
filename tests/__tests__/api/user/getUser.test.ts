import { handler } from '../../../../lambdas/api/user/getUser.js';
import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { APIGatewayProxyEventBuilder } from '../../../builders/apiGatewayProxyEventBuilder.js';
import { selectUserByExternalUuid, userTableName } from '../../../../repositories/userRepository.js';
import { UserEntryBuilder } from '../../../builders/userEntryBuilder.js';
import type { UserEntry } from '../../../../models/database/userEntry.js';
import { knexClient } from '../../../../lib/utils/knexClient.js';
import { randomUUID } from 'crypto';
import type { TenantEntry } from '../../../../models/database/tenantEntry.js';
import { tenantTableName } from '../../../../repositories/tenantRepository.js';
import { TenantEntryBuilder } from '../../../builders/tenantEntryBuilder.js';

describe('API - User - GET', () => {
  const tenantsGlobal: TenantEntry[] = [];
  const usersGlobal: UserEntry[] = [];

  beforeAll(async () => {
    const tenant = await knexClient(tenantTableName).insert(TenantEntryBuilder.make().withName('Tenant 1').build()).returning('*');

    tenantsGlobal.push(...tenant);

    const user = await knexClient(userTableName)
      .insert([
        UserEntryBuilder.make().withFirstName('John').withLastName('Doe').withEmail('john.doe@example.com').build(),
        UserEntryBuilder.make().withFirstName('Jane').withLastName('Paul').withEmail('jane.paul@example.com').build(),
      ])
      .returning('*');

    usersGlobal.push(...user);
  });

  it('Success - Should get a user', async () => {
    const event = APIGatewayProxyEventBuilder.make()
      .withPathParameters({
        uuid: usersGlobal[0].ExternalUuid,
      })
      .withQueryStringParameters({
        tenantId: tenantsGlobal[0].Id.toString(),
      })
      .build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(200);
    expect(res.body).toBeDefined();

    const resultData = JSON.parse(res.body!).data;
    expect(resultData.firstName).toBe(usersGlobal[0].FirstName);
    expect(resultData.lastName).toBe(usersGlobal[0].LastName);
    expect(resultData.email).toBe(usersGlobal[0].Email);
    expect(resultData.uuid).toBeDefined();
    expect(resultData.createdOn).toBeDefined();
    expect(resultData.modifiedOn).toBeDefined();
  });

  it('Error - Should return a 400 error if the path parameter is missing', async () => {
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
    expect(resultData).toBe('Missing path parameters: uuid');
  });

  it('Error - Should return a 400 error if the user does not exist', async () => {
    // Event with a random uuid on the path parameter
    const event = APIGatewayProxyEventBuilder.make()
      .withPathParameters({ uuid: randomUUID() })
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
    expect(resultData).toBe('User not found');
  });
});
