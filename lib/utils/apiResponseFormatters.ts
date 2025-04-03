import type { APIGatewayProxyResultV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import type { DeleteSuccess, FetchSuccess, PersistSuccess } from '../../models/api/responses/success.js';
import type { ConflictError, InternalError, UnauthorizedError } from '../../models/api/responses/errors.js';
import type { BadRequestError } from '../../models/api/responses/errors.js';

// TODO: Potentially move to a class
export async function formatOkResponse<T>(
  result: FetchSuccess<T> | PersistSuccess<T> | DeleteSuccess<T>,
): Promise<APIGatewayProxyStructuredResultV2> {
  const statusCode = result.statusCode ?? (!result.data || result.data.length === 0 ? 204 : 200);
  const message = result.message ?? 'Success';
  const type = result.name ?? 'Success';

  const body = {
    message,
    type,
    data: result.data,
  };

  return {
    statusCode,
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  };
}

// TODO: Potentially move to a class
export async function formatErrorResponse(
  result: BadRequestError | UnauthorizedError | ConflictError | InternalError,
): Promise<APIGatewayProxyStructuredResultV2> {
  // TODO: Fix this any
  const statusCode = (result as any).statusCode ?? 500;
  const message = result.message ?? 'Error';
  const type = result.name ?? 'Error';

  const body = {
    message,
    type,
  };

  return {
    statusCode,
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  };
}
