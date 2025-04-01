import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { logger } from '../../../lib/utils/logger.js';
import type { ValidatedAPIRequest } from '../../../models/api/validations.js';
import { PersistSuccess } from '../../../models/api/responses/success.js';
import { formatErrorResponse, formatOkResponse } from '../../../lib/utils/apiResponseFormatters.js';
import { validateAndParseBody, validateAndParsePathParams } from '../../../lib/utils/apiValidations.js';
import { BadRequestError, InternalError } from '../../../models/api/responses/errors.js';
import { CustomerEntry } from '../../../models/database/customerEntry.js';
import type { PutCustomerRequestPayload, PutCustomerResponsePayload } from '../../../models/api/payloads/customer.js';
import { selectCustomerByExternalUuid, selectCustomerById, updateCustomer } from '../../../repositories/customerRepository.js';

export async function handler(request: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<APIGatewayProxyResultV2> {
  logger.info('Request received: ', request);

  return validateRequest(request)
    .then(persistRecords)
    .then(formatResponseData)
    .then((response) => formatOkResponse(response))
    .catch((error) => formatErrorResponse(error));
}

async function validateRequest(request: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<ValidatedAPIRequest<PutCustomerRequestPayload>> {
  logger.info('Start - validateRequest');

  const parsedRequestBody = validateAndParseBody<PutCustomerRequestPayload>(request, [
    'firstName',
    'lastName',
    'email',
    'phone',
    'street',
    'city',
    'state',
    'zipCode',
  ]);
  const parsedPathParameter = validateAndParsePathParams<{ [param: string]: string }>(request, ['uuid']);

  // TODO: Pull tenantId and userId from the token
  return { tenantId: null, userId: null, payload: parsedRequestBody, pathParameter: parsedPathParameter.uuid };
}

export async function persistRecords(validatedRequest: ValidatedAPIRequest<PutCustomerRequestPayload>): Promise<number> {
  logger.info('Start - persistRecords');

  // Validate the customer exists
  const customer = await selectCustomerByExternalUuid(validatedRequest.pathParameter!);

  if (!customer) {
    throw new BadRequestError('Customer not found');
  }

  // Update the customer
  const mappedCustomer: Partial<CustomerEntry> = CustomerEntry.fromPutRequestPayload(validatedRequest.payload);
  await updateCustomer(customer.Id, mappedCustomer);

  return customer.Id;
}

export async function formatResponseData(customerId: number): Promise<PersistSuccess<PutCustomerResponsePayload>> {
  logger.info('Start - formatResponse');

  const customer = await selectCustomerById(customerId);

  if (!customer) {
    throw new InternalError('Customer not found');
  }

  return new PersistSuccess<PutCustomerResponsePayload>('Customer has been updated', customer.toPublic());
}
