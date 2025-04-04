import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { logger } from '../../../lib/utils/logger.js';
import { formatErrorResponse, formatOkResponse } from '../../../lib/utils/apiResponseFormatters.js';
import { validateAndParsePathParams, validateAndParseQueryParams } from '../../../lib/utils/apiValidations.js';
import type { ValidatedAPIRequest } from '../../../models/api/validations.js';
import { QueryParamDataType } from '../../../models/api/validations.js';
import { BadRequestError } from '../../../models/api/responses/errors.js';
import type { TaskEntry } from '../../../models/database/taskEntry.js';
import { selectTaskByExternalUuid } from '../../../repositories/taskRepository.js';
import type { GetTaskResponsePayload } from '../../../models/api/payloads/task.js';
import { FetchSuccess, type PersistSuccess } from '../../../models/api/responses/success.js';

export async function handler(request: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<APIGatewayProxyStructuredResultV2> {
  logger.info('Request received: ', request);

  return validateRequest(request)
    .then(queryRecords)
    .then(formatResponseData)
    .then((response) => formatOkResponse(response))
    .catch((error) => formatErrorResponse(error));
}

async function validateRequest(request: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<ValidatedAPIRequest<null>> {
  logger.info('Start - validateRequest');

  const parsedPathParameter = validateAndParsePathParams<{ [param: string]: string }>(request, ['uuid']);

  // TODO: Pull tenantId and userId from the token
  const eventQueryParams = validateAndParseQueryParams<{ tenantId: number }>(request, [
    { name: 'tenantId', dataType: QueryParamDataType.number, required: true },
  ]);

  return { tenantId: eventQueryParams.tenantId, userId: null, payload: null, pathParameter: parsedPathParameter.uuid };
}

export async function queryRecords(validatedRequest: ValidatedAPIRequest<null>): Promise<TaskEntry> {
  logger.info('Start - queryRecords');

  // Validate the task if exists
  const task = await selectTaskByExternalUuid(validatedRequest.pathParameter!);

  if (!task) {
    throw new BadRequestError('Task not found');
  }

  return task;
}

export async function formatResponseData(task: TaskEntry): Promise<FetchSuccess<GetTaskResponsePayload>> {
  logger.info('Start - formatResponse');

  return new FetchSuccess<GetTaskResponsePayload>('Successfully fetched task', task.toPublic());
}
