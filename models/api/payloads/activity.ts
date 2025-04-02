import type { PaginatedResponse } from '../responses/pagination.js';

/** The exposed Activity object */
export interface PublicActivity {
  uuid: string; // Only exposes the uuid
  dealUuid: string;
  description: string;
  date: string;
  imageUrl: string;
  createdOn: string;
  modifiedOn: string | null;
  deletedOn: string | null;
}

// POST activity payloads
export interface PostActivityRequestPayload extends Omit<PublicActivity, 'uuid' | 'createdOn' | 'modifiedOn' | 'deletedOn'> {}

export type PostActivityResponsePayload = PublicActivity;

// PUT activity payloads
export interface PutActivityRequestPayload extends Omit<PublicActivity, 'uuid' | 'dealUuid' | 'createdOn' | 'modifiedOn' | 'deletedOn'> {}

export type PutActivityResponsePayload = PublicActivity;

// GET activity payloads
export type GetActivityResponsePayload = PublicActivity;

// GET activity list payloads
export type GetActivityListResponsePayload = PaginatedResponse<PublicActivity>;

export interface GetActivityListFilter {
  limit: number;
  offset: number;
  tenantId: number; // TODO: Remove once the tenant is pulled from the token
}
