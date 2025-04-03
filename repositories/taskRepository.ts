import { knexClient } from '../lib/utils/knexClient.js';
import { logger } from '../lib/utils/logger.js';
import type { PaginatedResponse } from '../models/api/responses/pagination.js';
import { TaskEntry } from '../models/database/taskEntry.js';

export const taskTableName = 'Task';

/** Insert the task */
export async function insertTask(task: Partial<TaskEntry>): Promise<number> {
  const query = knexClient(taskTableName).insert(task).returning('Id');
  const record = await query;

  logger.info(`Successfully inserted task. Id: ${record[0].Id}`);
  return record[0].Id;
}

/** Get the task by Id */
export async function selectTaskById(id: number): Promise<TaskEntry | null> {
  const [task] = await knexClient(taskTableName).select('*').where('Id', id).whereNull(`${taskTableName}.DeletedOn`);

  return task ? new TaskEntry(task) : null;
}

/** Get the Task by ExternalUuid */
export async function selectTaskByExternalUuid(externalUuid: string): Promise<TaskEntry | null> {
  const [task] = await knexClient(taskTableName).select('*').where('ExternalUuid', externalUuid).whereNull(`${taskTableName}.DeletedOn`);

  return task ? new TaskEntry(task) : null;
}

export async function selectTasks(limit: number, offset: number, tenantId: number | null): Promise<PaginatedResponse<TaskEntry>> {
  // Base query without deleted task
  const baseQuery = knexClient(taskTableName).whereNull(`${taskTableName}.DeletedOn`);

  if (tenantId) {
    baseQuery.where(`${taskTableName}.TenantId`, tenantId);
  }

  // Get the tasks
  const tasks = await baseQuery.clone().limit(limit).offset(offset).select('*');

  // Get the total number of tasks
  const total = (await baseQuery.clone().count('*'))[0]['count'];

  return {
    items: tasks.map((task) => new TaskEntry(task)),
    total: Number(total),
  };
}

/** Update the task */
export async function updateTask(taskId: number, task: Partial<TaskEntry>): Promise<void> {
  await knexClient(taskTableName).update(task).where('Id', taskId);

  logger.info(`Successfully updated Task. Id: ${taskId}`);
}

/** Delete the Task */
export async function softDeleteTaskById(taskId: number): Promise<void> {
  const [record] = await knexClient(taskTableName).update({ DeletedOn: new Date().toISOString() }).where('Id', taskId).returning('Id');

  logger.info(`Successfully soft deleted Task. Id: ${record.Id}`);
}
