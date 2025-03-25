import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { logger } from '../../../lib/utils/logger.js';
import { DeleteSuccess } from '../../../models/api/responses/success.js';
import { formatErrorResponse, formatOkResponse } from '../../../lib/utils/apiResponseFormatters.js';
import { validateAndParsePathParams } from '../../../lib/utils/apiValidations.js';
import { BadRequestError } from '../../../models/api/responses/errors.js';
import type { ValidatedAPIRequest } from '../../../models/api/validations.js';
import { selectActivityByExternalUuid, softDeleteActivityById } from '../../../repositories/activityRepository.js';

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

  // TODO: Pull tenantId and userId from the token

  return { tenantId: null, userId: null, payload: null, pathParameter: parsedPathParameter.uuid };
}

export async function persistRecords(validatedRequest: ValidatedAPIRequest<null>): Promise<void> {
  logger.info('Start - persistRecords');

  // Validate the activity if exists
  const activityUuid = validatedRequest.pathParameter!;
  const activity = await selectActivityByExternalUuid(activityUuid);

  if (!activity) {
    throw new BadRequestError('Activity not found');
  }

  // Soft delete the customer
  await softDeleteActivityById(activity.Id);
}

export async function formatResponseData(): Promise<DeleteSuccess<null>> {
  logger.info('Start - formatResponse');

  return new DeleteSuccess<null>('Activity has been deleted');
}
