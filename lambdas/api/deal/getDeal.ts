import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { logger } from '../../../lib/utils/logger.js';
import { FetchSuccess, PersistSuccess } from '../../../models/api/responses/success.js';
import { formatErrorResponse, formatOkResponse } from '../../../lib/utils/apiResponseFormatters.js';
import { validateAndParsePathParams, validateAndParseQueryParams } from '../../../lib/utils/apiValidations.js';
import { BadRequestError } from '../../../models/api/responses/errors.js';
import type { ValidatedAPIRequest } from '../../../models/api/validations.js';
import { QueryParamDataType } from '../../../models/api/validations.js';
import type { DealEntry, ExtendedDealEntry } from '../../../models/database/dealEntry.js';
import { selectDealByExternalUuid } from '../../../repositories/dealRepository.js';
import type { GetDealResponsePayload } from '../../../models/api/payloads/deal.js';

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

export async function queryRecords(validatedRequest: ValidatedAPIRequest<null>): Promise<ExtendedDealEntry> {
  logger.info('Start - queryRecords');

  // Validate the deal if exists
  const deal = await selectDealByExternalUuid(validatedRequest.pathParameter!);

  if (!deal) {
    throw new BadRequestError('Deal not found');
  }

  return deal;
}

export async function formatResponseData(deal: ExtendedDealEntry): Promise<PersistSuccess<GetDealResponsePayload>> {
  logger.info('Start - formatResponse');

  return new FetchSuccess<GetDealResponsePayload>('Successfully fetched deal', deal.toPublic());
}
