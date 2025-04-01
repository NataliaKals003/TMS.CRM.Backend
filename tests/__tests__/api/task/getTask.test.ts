import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { APIGatewayProxyEventBuilder } from '../../../builders/apiGatewayProxyEventBuilder.js';
import { knexClient } from '../../../../lib/utils/knexClient.js';
import { randomUUID } from 'crypto';
import type { TenantEntry } from '../../../../models/database/tenantEntry.js';
import { tenantTableName } from '../../../../repositories/tenantRepository.js';
import { TenantEntryBuilder } from '../../../builders/tenantEntryBuilder.js';
import type { TaskEntry } from '../../../../models/database/taskEntry.js';
import { taskTableName } from '../../../../repositories/taskRepository.js';
import { TaskEntryBuilder } from '../../../builders/taskEntryBuilder.js';
import { handler } from '../../../../lambdas/api/task/getTask.js';
describe('API - Task - GET', () => {
  const tenantsGlobal: TenantEntry[] = [];
  const tasksGlobal: TaskEntry[] = [];

  beforeAll(async () => {
    const tenant = await knexClient(tenantTableName).insert(TenantEntryBuilder.make().withName('Tenant 1').build()).returning('*');
    tenantsGlobal.push(...tenant);

    const task = await knexClient(taskTableName)
      .insert([
        TaskEntryBuilder.make()
          .withTenantId(tenantsGlobal[0].Id)
          .withDescription('Test are now implemented')
          .withDueDate(new Date().toISOString())
          .withCompleted(true)
          .build(),
      ])
      .returning('*');

    tasksGlobal.push(...task);
  });

  it('Success - Should get a task', async () => {
    const event = APIGatewayProxyEventBuilder.make()
      .withPathParameters({
        uuid: tasksGlobal[0].ExternalUuid,
      })
      .build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(200);
    expect(res.body).toBeDefined();

    const resultData = JSON.parse(res.body!).data;
    expect(resultData.description).toBe(tasksGlobal[0].Description);
    expect(new Date(resultData.dueDate).getTime()).toBeCloseTo(new Date(tasksGlobal[0].DueDate).getTime());
    expect(resultData.completed).toBe(tasksGlobal[0].Completed);
    expect(resultData.uuid).toBeDefined();
    expect(resultData.createdOn).toBeDefined();
    expect(resultData.modifiedOn).toBeDefined();
  });

  it('Error - Should return a 400 error if the path parameter is missing', async () => {
    // Event missing the uuid path parameter
    const event = APIGatewayProxyEventBuilder.make().build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(400);
    expect(res.body).toBeDefined();

    const resultData = JSON.parse(res.body!).message;
    expect(resultData).toBe('Missing path parameters: uuid');
  });

  it('Error - Should return a 400 error if the task does not exist', async () => {
    // Event with a random uuid on the path parameter
    const event = APIGatewayProxyEventBuilder.make().withPathParameters({ uuid: randomUUID() }).build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(400);
    expect(res.body).toBeDefined();

    const resultData = JSON.parse(res.body!).message;
    expect(resultData).toBe('Task not found');
  });
});
