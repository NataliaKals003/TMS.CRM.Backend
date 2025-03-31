import type { integer } from 'aws-sdk/clients/cloudfront.js';
import type { DealProgress, RoomAccess } from '../../database/dealEntry.js';
import type { PaginatedResponse } from '../responses/pagination.js';
import type { text } from 'aws-sdk/clients/customerprofiles.js';

/** The exposed Deal object */
export interface PublicDeal {
  uuid: string; // Only exposes the uuid
  customer: {
    uuid: string;
    customerImageUrl: string | null;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  price: number;
  street: text;
  city: text;
  state: text;
  zipCode: text;
  dealImageUrl: string;
  roomArea: number;
  numberOfPeople: integer;
  appointmentDate: string;
  progress: DealProgress;
  specialInstructions: string;
  roomAccess: RoomAccess;
  createdOn: string;
  modifiedOn: string | null;
  deletedOn: string | null;
}

// POST deal payloads
export interface PostDealRequestPayload extends Omit<PublicDeal, 'uuid' | 'customer' | 'createdOn' | 'modifiedOn' | 'deletedOn'> {
  customerUuid: string;
}

export type PostDealResponsePayload = PublicDeal;

// PUT deal payloads
export interface PutDealRequestPayload extends Omit<PublicDeal, 'uuid' | 'customer' | 'createdOn' | 'modifiedOn' | 'deletedOn'> {}

export type PutDealResponsePayload = PublicDeal;

// GET customer payloads
export type GetDealResponsePayload = PublicDeal;

// GET customer list payloads
export type GetDealListResponsePayload = PaginatedResponse<PublicDeal>;

export interface GetDealListFilter {
  limit: number;
  offset: number;
  tenantId: number; // TODO: Remove once the tenant is pulled from the token
}
