import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { logger } from '../../../lib/utils/logger.js';
import { FetchSuccess, PersistSuccess } from '../../../models/api/responses/success.js';
import { formatErrorResponse, formatOkResponse } from '../../../lib/utils/apiResponseFormatters.js';
import { validateAndParsePathParams } from '../../../lib/utils/apiValidations.js';
import { BadRequestError } from '../../../models/api/responses/errors.js';
import type { ValidatedAPIRequest } from '../../../models/api/validations.js';
import { selectActivityByExternalUuid } from '../../../repositories/activityRepository.js';
import type { ActivityEntry } from '../../../models/database/activityEntry.js';
import type { GetActivityResponsePayload } from '../../../models/api/payloads/activity.js';

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

  const dealId = request.queryStringParameters?.dealId;
  if (!dealId) {
    throw new BadRequestError('Missing query parameter: dealId');
  }

  // TODO: Pull tenantId and userId from the token

  return { tenantId: null, userId: null, payload: null, pathParameter: parsedPathParameter.uuid, queryParameters: { dealId } };
}

export async function queryRecords(validatedRequest: ValidatedAPIRequest<null>): Promise<ActivityEntry> {
  logger.info('Start - queryRecords');

  // Validate the activity if exists
  const activityUuid = validatedRequest.pathParameter!;
  const activity = await selectActivityByExternalUuid(activityUuid);

  if (!activity) {
    throw new BadRequestError('Activity not found');
  }

  return activity;
}

export async function formatResponseData(activity: ActivityEntry): Promise<PersistSuccess<GetActivityResponsePayload>> {
  logger.info('Start - formatResponse');

  return new FetchSuccess<GetActivityResponsePayload>('Successfully fetched activity', activity.toPublic());
}
