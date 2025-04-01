import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { logger } from '../../../lib/utils/logger.js';
import type { ValidatedAPIRequest } from '../../../models/api/validations.js';
import { PersistSuccess } from '../../../models/api/responses/success.js';
import { formatErrorResponse, formatOkResponse } from '../../../lib/utils/apiResponseFormatters.js';
import { validateAndParseBody, validateAndParsePathParams } from '../../../lib/utils/apiValidations.js';
import { BadRequestError, InternalError } from '../../../models/api/responses/errors.js';
import type { PutTaskRequestPayload, PutTaskResponsePayload } from '../../../models/api/payloads/task.js';
import { selectTaskByExternalUuid, selectTaskById, updateTask } from '../../../repositories/taskRepository.js';
import { TaskEntry } from '../../../models/database/taskEntry.js';

export async function handler(request: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<APIGatewayProxyResultV2> {
  logger.info('Request received: ', request);

  return validateRequest(request)
    .then(persistRecords)
    .then(formatResponseData)
    .then((response) => formatOkResponse(response))
    .catch((error) => formatErrorResponse(error));
}

async function validateRequest(request: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<ValidatedAPIRequest<PutTaskRequestPayload>> {
  logger.info('Start - validateRequest');

  const parsedRequestBody = validateAndParseBody<PutTaskRequestPayload>(request, ['description', 'dueDate', 'completed']);
  const parsedPathParameter = validateAndParsePathParams<{ [param: string]: string }>(request, ['uuid']);

  // TODO: Pull tenantId and userId from the token
  return { tenantId: null, userId: null, payload: parsedRequestBody, pathParameter: parsedPathParameter.uuid };
}

export async function persistRecords(validatedRequest: ValidatedAPIRequest<PutTaskRequestPayload>): Promise<number> {
  logger.info('Start - persistRecords');

  // Validate the task exists
  const task = await selectTaskByExternalUuid(validatedRequest.pathParameter!);

  if (!task) {
    throw new BadRequestError('Task not found');
  }

  // Update the task
  const mappedTask: Partial<TaskEntry> = TaskEntry.fromPutRequestPayload(validatedRequest.payload);
  await updateTask(task.Id, mappedTask);

  return task.Id;
}

export async function formatResponseData(taskId: number): Promise<PersistSuccess<PutTaskResponsePayload>> {
  logger.info('Start - formatResponse');

  const task = await selectTaskById(taskId);

  if (!task) {
    throw new InternalError('Task not found');
  }

  return new PersistSuccess<PutTaskResponsePayload>('Task has been updated', task.toPublic());
}
