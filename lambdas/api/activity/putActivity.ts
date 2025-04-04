import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { logger } from '../../../lib/utils/logger.js';
import type { ValidatedAPIRequest } from '../../../models/api/validations.js';
import { QueryParamDataType } from '../../../models/api/validations.js';
import { PersistSuccess } from '../../../models/api/responses/success.js';
import { formatErrorResponse, formatOkResponse } from '../../../lib/utils/apiResponseFormatters.js';
import { validateAndParseBody, validateAndParsePathParams, validateAndParseQueryParams } from '../../../lib/utils/apiValidations.js';
import { BadRequestError, InternalError } from '../../../models/api/responses/errors.js';
import type { PutActivityRequestPayload, PutActivityResponsePayload } from '../../../models/api/payloads/activity.js';
import { selectActivityByExternalUuid, selectActivityById, updateActivity } from '../../../repositories/activityRepository.js';
import { ActivityEntry } from '../../../models/database/activityEntry.js';
import { putActivityRequestSchema } from '../../../models/api/payloads/activity.js';

export async function handler(request: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<APIGatewayProxyResultV2> {
  logger.info('Request received: ', request);

  return validateRequest(request)
    .then(persistRecords)
    .then(formatResponseData)
    .then((response) => formatOkResponse(response))
    .catch((error) => formatErrorResponse(error));
}

async function validateRequest(request: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<ValidatedAPIRequest<PutActivityRequestPayload>> {
  logger.info('Start - validateRequest');

  const parsedRequestBody = validateAndParseBody<PutActivityRequestPayload>(request, putActivityRequestSchema);
  const parsedPathParameter = validateAndParsePathParams<{ [param: string]: string }>(request, ['uuid']);

  // TODO: Pull tenantId and userId from the token
  const eventQueryParams = validateAndParseQueryParams<{ tenantId: number }>(request, [
    { name: 'tenantId', dataType: QueryParamDataType.number, required: true },
  ]);

  return { tenantId: eventQueryParams.tenantId, userId: null, payload: parsedRequestBody, pathParameter: parsedPathParameter.uuid };
}

export async function persistRecords(validatedRequest: ValidatedAPIRequest<PutActivityRequestPayload>): Promise<number> {
  logger.info('Start - persistRecords');

  // Validate the activity exists
  const activity = await selectActivityByExternalUuid(validatedRequest.pathParameter!);

  if (!activity) {
    throw new BadRequestError('Activity not found');
  }

  // Update the activity
  const mappedActivity: Partial<ActivityEntry> = ActivityEntry.fromPutRequestPayload(validatedRequest.payload);
  await updateActivity(activity.Id, mappedActivity);

  return activity.Id;
}

export async function formatResponseData(activityId: number): Promise<PersistSuccess<PutActivityResponsePayload>> {
  logger.info('Start - formatResponse');

  const activity = await selectActivityById(activityId);

  if (!activity) {
    throw new BadRequestError('Activity not found');
  }

  return new PersistSuccess<PutActivityResponsePayload>('Activity has been updated', activity.toPublic(), 200);
}
