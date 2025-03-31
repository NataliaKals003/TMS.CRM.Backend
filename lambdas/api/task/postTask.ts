import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { logger } from '../../../lib/utils/logger.js';
import { PersistSuccess } from '../../../models/api/responses/success.js';
import { formatErrorResponse, formatOkResponse } from '../../../lib/utils/apiResponseFormatters.js';
import { validateAndParseBody } from '../../../lib/utils/apiValidations.js';
import { InternalError } from '../../../models/api/responses/errors.js';
import type { ValidatedAPIRequest } from '../../../models/api/validations.js';
import type { PostTaskRequestPayload, PostTaskResponsePayload } from '../../../models/api/payloads/task.js';
import { TaskEntry } from '../../../models/database/taskEntry.js';
import { insertTask, selectTaskById } from '../../../repositories/taskRepository.js';

export async function handler(request: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<APIGatewayProxyStructuredResultV2> {
  logger.info('Request received: ', request);

  return validateRequest(request)
    .then(persistRecords)
    .then(formatResponseData)
    .then((response) => formatOkResponse(response))
    .catch((error) => formatErrorResponse(error));
}

async function validateRequest(request: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<ValidatedAPIRequest<PostTaskRequestPayload>> {
  logger.info('Start - validateRequest');

  const parsedRequestBody = validateAndParseBody<PostTaskRequestPayload>(request, ['description', 'dueDate']);

  // TODO: Pull tenantId and userId from the token

  return { tenantId: null, userId: null, payload: parsedRequestBody };
}

export async function persistRecords(validatedRequest: ValidatedAPIRequest<PostTaskRequestPayload>): Promise<number> {
  logger.info('Start - persistRecords');

  const mappedTask: Partial<TaskEntry> = TaskEntry.fromPostRequestPayload(validatedRequest.payload);
  const taskId = await insertTask(mappedTask);
  // TODO: Create a link between the task and the tenant

  return taskId;
}

export async function formatResponseData(taskId: number): Promise<PersistSuccess<PostTaskResponsePayload>> {
  logger.info('Start - formatResponse');

  const task = await selectTaskById(taskId);

  if (!task) {
    throw new InternalError('Task not found');
  }

  const responsePayload = task.toPublic();

  return new PersistSuccess<PostTaskResponsePayload>('Task has been created', responsePayload);
}
