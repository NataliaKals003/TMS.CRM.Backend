import type { PaginatedResponse } from '../responses/pagination.js';

/** The exposed Customer object */
export interface PublicCustomer {
  uuid: string; // Only exposes the uuid
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  imageUrl: string;
  createdOn: string;
  modifiedOn: string | null;
  deletedOn: string | null;
}

// POST customer payloads
export interface PostCustomerRequestPayload extends Omit<PublicCustomer, 'uuid' | 'createdOn' | 'modifiedOn' | 'deletedOn'> {}

export type PostCustomerResponsePayload = PublicCustomer;

// PUT customer payloads
export interface PutCustomerRequestPayload extends Omit<PublicCustomer, 'uuid' | 'createdOn' | 'modifiedOn' | 'deletedOn'> {}

export type PutCustomerResponsePayload = PublicCustomer;

// GET customer payloads
export type GetCustomerResponsePayload = PublicCustomer;

// GET customer list payloads
export type GetCustomerListResponsePayload = PaginatedResponse<PublicCustomer>;

export interface GetCustomerListFilter {
  limit: number;
  offset: number;
  tenantId: number; // TODO: Remove once the tenant is pulled from the token
}
