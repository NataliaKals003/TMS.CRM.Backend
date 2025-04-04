import type { APIGatewayProxyResultV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { DeleteSuccess, FetchSuccess, PersistSuccess } from '../../models/api/responses/success.js';
import { BadRequestError, ConflictError, InternalError, UnauthorizedError, HttpError } from '../../models/api/responses/errors.js';

// TODO: Potentially move to a class
export async function formatOkResponse<T>(
  result: FetchSuccess<T> | PersistSuccess<T> | DeleteSuccess<T>,
): Promise<APIGatewayProxyStructuredResultV2> {
  const message = result.message ?? 'Success';
  const type = result.name ?? 'Success';

  const body = {
    message,
    type,
    data: result.data,
  };

  // For create operations, use 201 if no specific status code is provided
  // For update operations, use 200 if no specific status code is provided
  // For fetch operations, use 200 if data exists, 204 if no data
  // For delete operations, use 204
  const statusCode =
    result.statusCode ??
    (result instanceof DeleteSuccess
      ? 204
      : result instanceof PersistSuccess
        ? result.statusCode === 200
          ? 201
          : 200
        : result instanceof FetchSuccess
          ? result.data
            ? 200
            : 204
          : 200);

  return {
    statusCode,
    body: statusCode === 204 ? '' : JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  };
}

// TODO: Potentially move to a class
export async function formatErrorResponse(result: Error): Promise<APIGatewayProxyStructuredResultV2> {
  const statusCode = result instanceof HttpError ? (result.statusCode ?? 500) : 500;
  const message = result.message ?? 'Error';
  const type = result.name ?? 'Error';

  const body = {
    message,
    type,
    error: true,
  };

  return {
    statusCode,
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      'X-Error-Type': type,
    },
  };
}
