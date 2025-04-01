import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { logger } from '../../../lib/utils/logger.js';
import { PersistSuccess } from '../../../models/api/responses/success.js';
import { formatErrorResponse, formatOkResponse } from '../../../lib/utils/apiResponseFormatters.js';
import { validateAndParseBody } from '../../../lib/utils/apiValidations.js';
import { BadRequestError, InternalError } from '../../../models/api/responses/errors.js';
import type { ValidatedAPIRequest } from '../../../models/api/validations.js';
import type { PostActivityRequestPayload, PostActivityResponsePayload } from '../../../models/api/payloads/activity.js';
import { ActivityEntry } from '../../../models/database/activityEntry.js';
import { insertActivity, selectActivityById } from '../../../repositories/activityRepository.js';
import { selectDealByExternalUuid } from '../../../repositories/dealRepository.js';

export async function handler(request: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<APIGatewayProxyStructuredResultV2> {
  logger.info('Request received: ', request);

  return validateRequest(request)
    .then(persistRecords)
    .then(formatResponseData)
    .then((response) => formatOkResponse(response))
    .catch((error) => formatErrorResponse(error));
}

async function validateRequest(request: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<ValidatedAPIRequest<PostActivityRequestPayload>> {
  logger.info('Start - validateRequest');

  const parsedRequestBody = validateAndParseBody<PostActivityRequestPayload>(request, ['description', 'activityDate']);

  // TODO: Pull tenantId and userId from the token
  return { tenantId: null, userId: null, payload: parsedRequestBody };
}

export async function persistRecords(validatedRequest: ValidatedAPIRequest<PostActivityRequestPayload>): Promise<number> {
  logger.info('Start - persistRecords');

  // Select deal
  const deal = await selectDealByExternalUuid(validatedRequest.payload.dealUuid);
  if (!deal) {
    throw new BadRequestError('Deal does not exist');
  }

  const mappedActivity: Partial<ActivityEntry> = ActivityEntry.fromPostRequestPayload(validatedRequest.payload, deal.Id);
  const activityId = await insertActivity(mappedActivity);

  return activityId;
}

export async function formatResponseData(activityId: number): Promise<PersistSuccess<PostActivityResponsePayload>> {
  logger.info('Start - formatResponse');

  const activity = await selectActivityById(activityId);

  if (!activity) {
    throw new InternalError('Activity not found');
  }

  const responsePayload = activity.toPublic();

  return new PersistSuccess<PostActivityResponsePayload>('Activity has been created', await responsePayload);
}
