import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { APIGatewayProxyEventBuilder } from '../../../builders/apiGatewayProxyEventBuilder.js';
import { knexClient } from '../../../../lib/utils/knexClient.js';
import { randomUUID } from 'crypto';
import type { TenantEntry } from '../../../../models/database/tenantEntry.js';
import type { TaskEntry } from '../../../../models/database/taskEntry.js';
import { selectTaskByExternalUuid, taskTableName } from '../../../../repositories/taskRepository.js';
import { TaskEntryBuilder } from '../../../builders/taskEntryBuilder.js';
import type { PutTaskRequestPayload } from '../../../../models/api/payloads/task.js';
import { handler } from '../../../../lambdas/api/task/putTask.js';
import { tenantTableName } from '../../../../repositories/tenantRepository.js';
import { TenantEntryBuilder } from '../../../builders/tenantEntryBuilder.js';
describe('API - Task - PUT', () => {
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
          .withCompleted(false)
          .build(),
      ])
      .returning('*');

    tasksGlobal.push(...task);
  });

  it('Success - Should update a task', async () => {
    const payload: PutTaskRequestPayload = {
      description: 'Test are now updated',
      dueDate: tasksGlobal[0].DueDate,
      completed: true,
    };

    const event = APIGatewayProxyEventBuilder.make()
      .withPathParameters({
        uuid: tasksGlobal[0].ExternalUuid,
      })
      .withBody(payload)
      .build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(201);
    expect(res.body).toBeDefined();

    const resultData = JSON.parse(res.body!).data;
    expect(resultData.description).toBe(payload.description);
    expect(new Date(resultData.dueDate).getTime()).toBeCloseTo(new Date(tasksGlobal[0].DueDate).getTime());
    expect(resultData.completed).toBe(payload.completed);

    expect(resultData.uuid).toBeDefined();
    expect(resultData.createdOn).toBeDefined();
    expect(resultData.modifiedOn).toBeDefined();

    // Validate the database record
    const task = await selectTaskByExternalUuid(resultData.uuid);
    expect(task).toBeDefined();
    expect(task!.Description).toBe(payload.description);
    expect(task!.Completed).toBe(payload.completed);
  });

  it('Error - Should return a 400 error if the path parameter is missing', async () => {
    const payload: PutTaskRequestPayload = {
      description: 'Test are now updated',
      dueDate: tasksGlobal[0].DueDate,
      completed: true,
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
    const payload: Partial<PutTaskRequestPayload> = {
      dueDate: tasksGlobal[0].DueDate,
    };

    // Event missing the uuid path parameter
    const event = APIGatewayProxyEventBuilder.make().withPathParameters({ uuid: tasksGlobal[0].ExternalUuid }).withBody(payload).build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(400);
    expect(res.body).toBeDefined();

    const resultData = JSON.parse(res.body!).message;
    expect(resultData).toBe('Missing fields: description, completed');
  });

  it('Error - Should return a 400 error if the task does not exist', async () => {
    const payload: PutTaskRequestPayload = {
      description: 'Test are now updated',
      dueDate: new Date().toISOString(),
      completed: false,
    };

    // Event missing the uuid path parameter
    const event = APIGatewayProxyEventBuilder.make().withPathParameters({ uuid: randomUUID() }).withBody(payload).build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(400);
    expect(res.body).toBeDefined();

    const resultData = JSON.parse(res.body!).message;
    expect(resultData).toBe('Task not found');
  });
});
