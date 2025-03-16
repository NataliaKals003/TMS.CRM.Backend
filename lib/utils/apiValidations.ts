import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { BadRequestError } from '../../models/api/responses/errors.js';
import { QueryParamDataType, type ExpectedQueryParam } from '../../models/api/validations.js';

// Path params
export function validateAndParsePathParams<T>(event: APIGatewayProxyEventV2, requiredPathParams: string[] = []): T {
  if (!event.pathParameters) {
    throw new BadRequestError('Event path parameters not found');
  }

  const parsedEvent = typeof event === 'object' ? event : JSON.parse(event);
  const pathParamKeys = Object.keys(parsedEvent.pathParameters);
  const message = requiredPathParams.filter((field) => !pathParamKeys.includes(field)).join(', ');

  if (message) {
    throw new BadRequestError(`Missing path parameters: ${message}`);
  }

  return parsedEvent.pathParameters as T;
}

// Body params
export function validateAndParseBody<T>(event: APIGatewayProxyEventV2, requiredFields: string[] = []): T {
  if (!event.body) {
    throw new BadRequestError('Event body not found');
  }

  const parsedEvent = typeof event === 'object' ? event : JSON.parse(event);
  const parsedBody = JSON.parse(parsedEvent.body);
  const message = requiredFields.filter((field) => !(field in parsedBody)).join(', ');

  if (message) {
    throw new BadRequestError(`Missing fields: ${message}`);
  }

  return parsedBody as T;
}

// Query params
export function validateAndParseQueryParams<T>(event: APIGatewayProxyEventV2, expectedQueryParams: ExpectedQueryParam[] = []): T {
  if (!event.queryStringParameters) {
    throw new BadRequestError('Event query parameters not found');
  }

  const parsedEvent = typeof event === 'object' ? event : JSON.parse(event);
  const queryParamKeys = Object.keys(parsedEvent.queryStringParameters);
  const missingParams = expectedQueryParams
    .filter(({ name, required }) => required && !queryParamKeys.includes(name))
    .map(({ name }) => name)
    .join(', ');

  if (missingParams) {
    throw new BadRequestError(`Missing required query parameters: ${missingParams}`);
  }

  const validatedParams: any = {};

  for (const { name, dataType, required, enumType } of expectedQueryParams) {
    const value = parsedEvent.queryStringParameters[name];

    if (required && value === undefined) {
      throw new BadRequestError(`Missing required query parameter: ${name}`);
    }

    switch (dataType) {
      case QueryParamDataType.number:
        validatedParams[name] = value !== undefined ? extractQueryNumberParam(value, name) : undefined;
        break;
      case QueryParamDataType.date:
        validatedParams[name] = value !== undefined ? extractQueryDateParam(value, name) : undefined;
        break;
      case QueryParamDataType.array:
        validatedParams[name] = value !== undefined ? extractQueryArrayParam(value, name) : undefined;
        break;
      case QueryParamDataType.boolean:
        validatedParams[name] = value !== undefined ? extractQueryBooleanParam(value, name) : undefined;
        break;
      case QueryParamDataType.enum:
        validatedParams[name] = value !== undefined ? extractQueryEnumParam(value, name, enumType!) : undefined;
        break;
      default:
        throw new BadRequestError(`Invalid type specified for parameter: ${name}`);
    }
  }

  return validatedParams as T;
}

const invalidQueryParamMessage = (paramName: string) => `Invalid query parameter: ${paramName}`;

export function extractQueryNumberParam(value: string, paramName: string): number {
  try {
    const parsedNumber = Number(value);
    if (Number.isNaN(parsedNumber)) {
      throw new BadRequestError(invalidQueryParamMessage(paramName));
    }
    return parsedNumber;
  } catch {
    throw new BadRequestError(invalidQueryParamMessage(paramName));
  }
}

export function extractQueryDateParam(value: string, paramName: string): string {
  try {
    const parsedDate = new Date(value);
    const isValidDate = !Number.isNaN(parsedDate.getTime());

    if (!isValidDate) {
      throw new BadRequestError(invalidQueryParamMessage(paramName));
    }

    return parsedDate.toISOString();
  } catch {
    throw new BadRequestError(invalidQueryParamMessage(paramName));
  }
}

export function extractQueryArrayParam(value: string, paramName: string): string[] {
  try {
    const paramValues = value!.split(',');
    const validValues = paramValues.filter((v) => v.trim() !== '');

    if (!validValues.length) {
      throw new BadRequestError(invalidQueryParamMessage(paramName));
    }

    return validValues;
  } catch {
    throw new BadRequestError(invalidQueryParamMessage(paramName));
  }
}

export function extractQueryBooleanParam(param: string, paramName: string): boolean {
  try {
    return param === 'true';
  } catch {
    throw new BadRequestError(invalidQueryParamMessage(paramName));
  }
}

export function extractQueryEnumParam<T>(value: string, paramName: string, enumType: Record<string, T>): T {
  try {
    const enumValue = enumType[value];
    if (enumValue === undefined) {
      throw new BadRequestError(invalidQueryParamMessage(paramName));
    }
    return enumValue;
  } catch {
    throw new BadRequestError(invalidQueryParamMessage(paramName));
  }
}
