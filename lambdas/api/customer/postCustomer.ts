import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { logger } from '../../../lib/utils/logger.js';
import { PersistSuccess } from '../../../models/api/responses/success.js';
import { formatErrorResponse, formatOkResponse } from '../../../lib/utils/apiResponseFormatters.js';
import { validateAndParseBody } from '../../../lib/utils/apiValidations.js';
import { InternalError } from '../../../models/api/responses/errors.js';
import type { ValidatedAPIRequest } from '../../../models/api/validations.js';
import type { PostCustomerRequestPayload, PostCustomerResponsePayload } from '../../../models/api/payloads/customer.js';
import { CustomerEntry } from '../../../models/database/customerEntry.js';
import { insertCustomer, selectCustomerById } from '../../../repositories/customerRepository.js';

export async function handler(request: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<APIGatewayProxyStructuredResultV2> {
  logger.info('Request received: ', request);

  return validateRequest(request)
    .then(persistRecords)
    .then(formatResponseData)
    .then((response) => formatOkResponse(response))
    .catch((error) => formatErrorResponse(error));
}

async function validateRequest(request: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<ValidatedAPIRequest<PostCustomerRequestPayload>> {
  logger.info('Start - validateRequest');

  const parsedRequestBody = validateAndParseBody<PostCustomerRequestPayload>(request, [
    'firstName',
    'lastName',
    'email',
    'phone',
    'street',
    'city',
    'state',
    'zipCode',
    'profileImageUrl',
  ]);

  // TODO: Pull tenantId and userId from the token

  return { tenantId: null, userId: null, payload: parsedRequestBody };
}

export async function persistRecords(validatedRequest: ValidatedAPIRequest<PostCustomerRequestPayload>): Promise<number> {
  logger.info('Start - persistRecords');

  const mappedCustomer: Partial<CustomerEntry> = CustomerEntry.fromPostRequestPayload(validatedRequest.payload);
  const customerId = await insertCustomer(mappedCustomer);
  // TODO: Create a link between the customer and the tenant

  return customerId;
}

export async function formatResponseData(customerId: number): Promise<PersistSuccess<PostCustomerResponsePayload>> {
  logger.info('Start - formatResponse');

  const customer = await selectCustomerById(customerId);

  if (!customer) {
    throw new InternalError('Customer not found');
  }

  const responsePayload = customer.toPublic();

  return new PersistSuccess<PostCustomerResponsePayload>('Customer has been created', responsePayload);
}
