import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { APIGatewayProxyEventBuilder } from '../../../builders/apiGatewayProxyEventBuilder.js';
import { selectTaskByExternalUuid } from '../../../../repositories/taskRepository.js';
import { handler } from '../../../../lambdas/api/task/postTask.js';
import type { TenantEntry } from '../../../../models/database/tenantEntry.js';
import { knexClient } from '../../../../lib/utils/knexClient.js';
import { tenantTableName } from '../../../../repositories/tenantRepository.js';
import { TenantEntryBuilder } from '../../../builders/tenantEntryBuilder.js';

describe('API - Task - POST', () => {
  const tenantsGlobal: TenantEntry[] = [];

  beforeAll(async () => {
    const tenant = await knexClient(tenantTableName).insert(TenantEntryBuilder.make().withName('Tenant 1').build()).returning('*');
    tenantsGlobal.push(...tenant);
  });

  it('Success - Should create a task', async () => {
    const payload = {
      description: 'Test are now implemented',
      dueDate: new Date().toISOString(),
      completed: false,
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
    expect(resultData.uuid).toBeDefined();
    expect(resultData.description).toBe(payload.description);
    expect(resultData.dueDate).toBe(payload.dueDate);
    expect(resultData.completed).toBe(payload.completed);
    expect(resultData.createdOn).toBeDefined();
    expect(resultData.modifiedOn).toBeNull();

    // Validate the database record
    const task = await selectTaskByExternalUuid(resultData.uuid);
    expect(task).toBeDefined();
    expect(task?.TenantId).toBe(tenantsGlobal[0].Id);
  });

  it('Error - Should return a 400 error if the body is missing required fields', async () => {
    const event = APIGatewayProxyEventBuilder.make()
      .withBody({
        dueDate: new Date().toISOString(),
        completed: false,
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
    expect(resultData).toBe('Missing fields: description');
  });
});
