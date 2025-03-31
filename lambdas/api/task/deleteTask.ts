import { formatErrorResponse } from '../../../lib/utils/apiResponseFormatters.js';
import type { APIGatewayProxyResultV2 } from 'aws-lambda';
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { logger } from '../../../lib/utils/logger.js';
import { formatOkResponse } from '../../../lib/utils/apiResponseFormatters.js';
import type { ValidatedAPIRequest } from '../../../models/api/validations.js';
import { validateAndParsePathParams } from '../../../lib/utils/apiValidations.js';
import { BadRequestError } from '../../../models/api/responses/errors.js';
import { DeleteSuccess } from '../../../models/api/responses/success.js';
import { selectTaskByExternalUuid, softDeleteTaskById } from '../../../repositories/taskRepository.js';

export async function handler(request: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<APIGatewayProxyResultV2> {
  logger.info('Request received: ', request);

  return validateRequest(request)
    .then(persistRecords)
    .then(formatResponseData)
    .then((response) => formatOkResponse(response))
    .catch((error) => formatErrorResponse(error));
}

async function validateRequest(request: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<ValidatedAPIRequest<null>> {
  logger.info('Start - validateRequest');

  const parsedPathParameter = validateAndParsePathParams<{ [param: string]: string }>(request, ['uuid']);

  const taskUuid = parsedPathParameter.uuid;
  if (!taskUuid) {
    throw new BadRequestError('Missing path parameters: uuid');
  }

  // TODO: Pull tenantId and userId from the token
  return { tenantId: null, userId: null, payload: null, pathParameter: taskUuid };
}

export async function persistRecords(validatedRequest: ValidatedAPIRequest<null>): Promise<void> {
  logger.info('Start - persistRecords');

  // Validate the task exists
  const taskUuid = validatedRequest.pathParameter!;
  const task = await selectTaskByExternalUuid(taskUuid);

  if (!task) {
    throw new BadRequestError('Task not found');
  }

  // Soft delete the task
  await softDeleteTaskById(task.Id);
}

export async function formatResponseData(): Promise<DeleteSuccess<null>> {
  logger.info('Start - formatResponse');

  return new DeleteSuccess<null>('Task has been deleted');
}
