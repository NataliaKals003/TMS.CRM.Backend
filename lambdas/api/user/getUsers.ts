import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { logger } from '../../../lib/utils/logger.js';
import type { ValidatedAPIRequest } from '../../../models/api/validations.js';
import { FetchSuccess, PersistSuccess } from '../../../models/api/responses/success.js';
import { formatErrorResponse, formatOkResponse } from '../../../lib/utils/apiResponseFormatters.js';
import { validateAndParseQueryParams } from '../../../lib/utils/apiValidations.js';
import type { GetUserListFilter, GetUserListResponsePayload, PublicUser } from '../../../models/api/payloads/user.js';
import type { UserEntry } from '../../../models/database/userEntry.js';
import { QueryParamDataType } from '../../../models/api/validations.js';
import { selectUsers } from '../../../repositories/userRepository.js';
import type { PaginatedResponse } from '../../../models/api/responses/pagination.js';

export async function handler(request: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<APIGatewayProxyResultV2> {
  logger.info('Request received: ', request);

  return validateRequest(request)
    .then(queryRecords)
    .then(formatResponseData)
    .then((response) => formatOkResponse(response))
    .catch((error) => formatErrorResponse(error));
}

async function validateRequest(request: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<ValidatedAPIRequest<null, GetUserListFilter>> {
  logger.info('Start - validateRequest');

  const eventQueryParams = validateAndParseQueryParams<GetUserListFilter>(request, [
    { name: 'limit', dataType: QueryParamDataType.number, required: true },
    { name: 'offset', dataType: QueryParamDataType.number, required: true },
    { name: 'tenantId', dataType: QueryParamDataType.number, required: true },
  ]);

  // TODO: Pull tenantId and userId from the token

  return { tenantId: eventQueryParams.tenantId, userId: null, payload: null, queryParameters: eventQueryParams };
}

export async function queryRecords(validatedRequest: ValidatedAPIRequest<null, GetUserListFilter>): Promise<PaginatedResponse<UserEntry>> {
  logger.info('Start - queryRecords');

  const { limit, offset } = validatedRequest.queryParameters!;

  const queryResult: PaginatedResponse<UserEntry> = await selectUsers(limit, offset, validatedRequest.tenantId);

  return queryResult;
}

export async function formatResponseData(queryResult: PaginatedResponse<UserEntry>): Promise<FetchSuccess<GetUserListResponsePayload>> {
  logger.info('Start - formatResponse');

  const paginatedResponse: PaginatedResponse<PublicUser> = {
    items: queryResult.items.map((user) => user.toPublic()),
    total: queryResult.total,
  };

  return new FetchSuccess<GetUserListResponsePayload>('Successfully fetched users', paginatedResponse);
}
