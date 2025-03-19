import type { PaginatedResponse } from '../responses/pagination.js';

/** The exposed User object */
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
  profileImageUrl: string;
  createdOn: string;
  modifiedOn: string | null;
}

// POST customer payloads
export interface PostCustomerRequestPayload
  extends Pick<PublicCustomer, 'firstName' | 'lastName' | 'email' | 'phone' | 'street' | 'city' | 'state' | 'zipCode' | 'profileImageUrl'> {}

export type PostCustomerResponsePayload = PublicCustomer;

// PUT customer payloads
export interface PutCustomerRequestPayload
  extends Pick<PublicCustomer, 'firstName' | 'lastName' | 'email' | 'phone' | 'street' | 'city' | 'state' | 'zipCode' | 'profileImageUrl'> {}

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
