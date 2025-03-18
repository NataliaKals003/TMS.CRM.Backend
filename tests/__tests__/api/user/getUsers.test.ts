import { handler } from '../../../../lambdas/api/user/getUsers.js';
import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { APIGatewayProxyEventBuilder } from '../../../builders/apiGatewayProxyEventBuilder.js';
import { userTableName } from '../../../../repositories/userRepository.js';
import { UserEntryBuilder } from '../../../builders/userEntryBuilder.js';
import { knexClient } from '../../../../lib/utils/knexClient.js';
import type { TenantEntry } from '../../../../models/database/tenantEntry.js';
import { tenantTableName } from '../../../../repositories/tenantRepository.js';
import { TenantEntryBuilder } from '../../../builders/tenantEntryBuilder.js';
import { userTenantTableName } from '../../../../repositories/userTenantRepository.js';
import { UserTenantEntryBuilder } from '../../../builders/userTenantEntryBuilder.js';

describe('API - User - GET', () => {
  const tenantsGlobal: TenantEntry[] = [];

  beforeAll(async () => {
    const tenant = await knexClient(tenantTableName)
      .insert([
        TenantEntryBuilder.make().withFirstName('Tenant').withLastName('One').withEmail('tenant1@example.com').build(),
        TenantEntryBuilder.make().withFirstName('Tenant').withLastName('Two').withEmail('tenant2@example.com').build(),
        TenantEntryBuilder.make().withFirstName('Tenant').withLastName('Three').withEmail('tenant3@example.com').build(),
      ])
      .returning('*');
    tenantsGlobal.push(...tenant);

    // Insert 9 users and link them to the first tenant
    const firstTenantUsers = await knexClient(userTableName)
      .insert([
        UserEntryBuilder.make().withFirstName('John').withLastName('Doe').withEmail('john.doe@example.com').build(),
        UserEntryBuilder.make().withFirstName('Jane').withLastName('Paul').withEmail('jane.paul@example.com').build(),
        UserEntryBuilder.make().withFirstName('Marcus').withLastName('Aurelius').withEmail('marcus.aurelius@example.com').build(),
        UserEntryBuilder.make().withFirstName('Junior').withLastName('Santos').withEmail('junior.santos@example.com').build(),
        UserEntryBuilder.make().withFirstName('Natalia').withLastName('Pontes').withEmail('natalia.pontes@example.com').build(),
        UserEntryBuilder.make().withFirstName('Elena').withLastName('Rodriguez').withEmail('elena.rodriguez@example.com').build(),
        UserEntryBuilder.make().withFirstName('Kai').withLastName('Chen').withEmail('kai.chen@example.com').build(),
        UserEntryBuilder.make().withFirstName('Sofia').withLastName('Patel').withEmail('sofia.patel@example.com').build(),
        UserEntryBuilder.make().withFirstName('Lucas').withLastName('Nielsen').withEmail('lucas.nielsen@example.com').build(),
      ])
      .returning('Id');

    await knexClient(userTenantTableName).insert(
      firstTenantUsers.map((user) => UserTenantEntryBuilder.make().withUserId(user.Id).withTenantId(tenantsGlobal[0].Id).build()),
    );

    // Create a user and link it to the second tenant
    const secondTenantUsers = await knexClient(userTableName)
      .insert([UserEntryBuilder.make().withFirstName('Paulo').withLastName('Albuquerque').withEmail('paulo.albuquerque@example.com').build()])
      .returning('Id');

    await knexClient(userTenantTableName).insert([
      UserTenantEntryBuilder.make().withUserId(secondTenantUsers[0].Id).withTenantId(tenantsGlobal[1].Id).build(),
    ]);
  });

  it('Success - Should get users with pagination', async () => {
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
    expect(resultData.total).toBe(9);
  });

  it('Success - Should get users with pagination using offset', async () => {
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
    expect(resultData.items.length).toBe(4); // Exclude the first 5 users
    expect(resultData.total).toBe(9); // Total number of users should still be 9
  });

  it('Success - Should return 0 users if the tenant has no users', async () => {
    const event = APIGatewayProxyEventBuilder.make()
      .withQueryStringParameters({
        limit: '5',
        offset: '0',
        tenantId: tenantsGlobal[2].Id.toString(), // TODO: Remove once the tenant is pulled from the token
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
    const event = APIGatewayProxyEventBuilder.make().build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(400);
    expect(res.body).toBeDefined();

    const resultData = JSON.parse(res.body!).errorMessage;
    expect(resultData).toContain('Missing required query parameters: limit, offset');
  });
});
