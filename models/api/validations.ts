export interface ValidatedAPIRequest<T, Q = null> {
  userId: string | null;
  tenantId: number;
  payload: T;
  pathParameter?: string;
  queryParameters?: Q;
}

export enum QueryParamDataType {
  string,
  number,
  boolean,
  date,
  array,
  enum,
}

export interface ExpectedQueryParam {
  name: string;
  required: boolean;
  dataType: QueryParamDataType;
  enumType?: Record<string, unknown>;
}
