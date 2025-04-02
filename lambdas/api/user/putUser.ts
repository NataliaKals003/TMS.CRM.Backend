import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { logger } from '../../../lib/utils/logger.js';
import type { ValidatedAPIRequest } from '../../../models/api/validations.js';
import { PersistSuccess } from '../../../models/api/responses/success.js';
import { formatErrorResponse, formatOkResponse } from '../../../lib/utils/apiResponseFormatters.js';
import { validateAndParseBody, validateAndParsePathParams, validateAndParseQueryParams } from '../../../lib/utils/apiValidations.js';
import { selectUserByExternalUuid, selectUserById, updateUser } from '../../../repositories/userRepository.js';
import { BadRequestError, InternalError } from '../../../models/api/responses/errors.js';
import { UserEntry } from '../../../models/database/userEntry.js';
import type { PutUserRequestPayload, PutUserResponsePayload } from '../../../models/api/payloads/user.js';
import { QueryParamDataType } from '../../../models/api/validations.js';
export async function handler(request: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<APIGatewayProxyResultV2> {
  logger.info('Request received: ', request);

  return validateRequest(request)
    .then(persistRecords)
    .then(formatResponseData)
    .then((response) => formatOkResponse(response))
    .catch((error) => formatErrorResponse(error));
}

async function validateRequest(request: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<ValidatedAPIRequest<PutUserRequestPayload>> {
  logger.info('Start - validateRequest');

  const parsedPathParameter = validateAndParsePathParams<{ [param: string]: string }>(request, ['uuid']);
  const parsedRequestBody = validateAndParseBody<PutUserRequestPayload>(request, ['firstName', 'lastName', 'email']);

  // TODO: Pull tenantId and userId from the token
  const eventQueryParams = validateAndParseQueryParams<{ tenantId: number }>(request, [
    { name: 'tenantId', dataType: QueryParamDataType.number, required: true },
  ]);

  return { tenantId: eventQueryParams.tenantId, userId: null, payload: parsedRequestBody, pathParameter: parsedPathParameter.uuid };
}

export async function persistRecords(validatedRequest: ValidatedAPIRequest<PutUserRequestPayload>): Promise<number> {
  logger.info('Start - persistRecords');

  // Validate the user exists
  const user = await selectUserByExternalUuid(validatedRequest.pathParameter!);

  if (!user) {
    throw new BadRequestError('User not found');
  }

  // Update the user
  const mappedUser: Partial<UserEntry> = UserEntry.fromPutRequestPayload(validatedRequest.payload);
  await updateUser(user.Id, mappedUser);

  return user.Id;
}

export async function formatResponseData(userId: number): Promise<PersistSuccess<PutUserResponsePayload>> {
  logger.info('Start - formatResponse');

  const user = await selectUserById(userId);

  if (!user) {
    throw new InternalError('User not found');
  }

  return new PersistSuccess<PutUserResponsePayload>('User has been updated', user.toPublic());
}
