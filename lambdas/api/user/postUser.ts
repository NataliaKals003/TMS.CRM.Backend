import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { logger } from '../../../lib/utils/logger.js';
import { PersistSuccess } from '../../../models/api/responses/success.js';
import { formatErrorResponse, formatOkResponse } from '../../../lib/utils/apiResponseFormatters.js';
import { validateAndParseBody } from '../../../lib/utils/apiValidations.js';
import { selectUserById, insertUser } from '../../../repositories/userRepository.js';
import { InternalError } from '../../../models/api/responses/errors.js';
import { UserEntry } from '../../../models/database/userEntry.js';
import type { PostUserRequestPayload, PostUserResponsePayload } from '../../../models/api/payloads/user.js';
import type { ValidatedAPIRequest } from '../../../models/api/validations.js';

export async function handler(request: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<APIGatewayProxyStructuredResultV2> {
  logger.info('Request received: ', request);

  return validateRequest(request)
    .then(persistRecords)
    .then(formatResponseData)
    .then((response) => formatOkResponse(response))
    .catch((error) => formatErrorResponse(error));
}

async function validateRequest(request: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<ValidatedAPIRequest<PostUserRequestPayload>> {
  logger.info('Start - validateRequest');

  const parsedRequestBody = validateAndParseBody<PostUserRequestPayload>(request, ['firstName', 'lastName', 'email']);

  // TODO: Pull tenantId and userId from the token
  return { tenantId: null, userId: null, payload: parsedRequestBody };
}

export async function persistRecords(validatedRequest: ValidatedAPIRequest<PostUserRequestPayload>): Promise<number> {
  logger.info('Start - persistRecords');

  const mappedUser: Partial<UserEntry> = UserEntry.fromPostRequestPayload(validatedRequest.payload);
  const userId = await insertUser(mappedUser);

  // TODO: Create a link between the user and the tenant
  return userId;
}

export async function formatResponseData(userId: number): Promise<PersistSuccess<PostUserResponsePayload>> {
  logger.info('Start - formatResponse');

  const user = await selectUserById(userId);

  if (!user) {
    throw new InternalError('User not found');
  }

  const responsePayload = user.toPublic();

  return new PersistSuccess<PostUserResponsePayload>('User has been created', responsePayload);
}
