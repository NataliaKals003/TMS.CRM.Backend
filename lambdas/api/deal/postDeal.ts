import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { logger } from '../../../lib/utils/logger.js';
import { PersistSuccess } from '../../../models/api/responses/success.js';
import { formatErrorResponse, formatOkResponse } from '../../../lib/utils/apiResponseFormatters.js';
import { validateAndParseBody, validateAndParseQueryParams } from '../../../lib/utils/apiValidations.js';
import { BadRequestError, InternalError } from '../../../models/api/responses/errors.js';
import type { ValidatedAPIRequest } from '../../../models/api/validations.js';
import { QueryParamDataType } from '../../../models/api/validations.js';
import type { PostDealRequestPayload, PostDealResponsePayload } from '../../../models/api/payloads/deal.js';
import { DealEntry } from '../../../models/database/dealEntry.js';
import { insertDeal, selectDealById } from '../../../repositories/dealRepository.js';
import { selectCustomerByExternalUuid } from '../../../repositories/customerRepository.js';

export async function handler(request: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<APIGatewayProxyStructuredResultV2> {
  logger.info('Request received: ', request);

  return validateRequest(request)
    .then(persistRecords)
    .then(formatResponseData)
    .then((response) => formatOkResponse(response))
    .catch((error) => formatErrorResponse(error));
}

async function validateRequest(request: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<ValidatedAPIRequest<PostDealRequestPayload>> {
  logger.info('Start - validateRequest');

  const parsedRequestBody = validateAndParseBody<PostDealRequestPayload>(request, [
    'price',
    'street',
    'city',
    'state',
    'zipCode',
    'roomArea',
    'numberOfPeople',
    'appointmentDate',
    'progress',
    'roomAccess',
  ]);

  // TODO: Pull tenantId and userId from the token
  const eventQueryParams = validateAndParseQueryParams<{ tenantId: number }>(request, [
    { name: 'tenantId', dataType: QueryParamDataType.number, required: true },
  ]);

  return { tenantId: eventQueryParams.tenantId, userId: null, payload: parsedRequestBody };
}

export async function persistRecords(validatedRequest: ValidatedAPIRequest<PostDealRequestPayload>): Promise<number> {
  logger.info('Start - persistRecords');

  const customer = await selectCustomerByExternalUuid(validatedRequest.payload.customerUuid);
  if (!customer) {
    throw new BadRequestError('Customer does not exist');
  }

  const mappedDeal: Partial<DealEntry> = {
    ...DealEntry.fromPostRequestPayload(validatedRequest.payload, customer.Id),
    TenantId: validatedRequest.tenantId,
  };
  const dealId = await insertDeal(mappedDeal);

  return dealId;
}

export async function formatResponseData(dealId: number): Promise<PersistSuccess<PostDealResponsePayload>> {
  logger.info('Start - formatResponse');

  const deal = await selectDealById(dealId);
  if (!deal) {
    throw new InternalError('Deal not found');
  }

  return new PersistSuccess<PostDealResponsePayload>('Deal has been created', deal.toPublic());
}
