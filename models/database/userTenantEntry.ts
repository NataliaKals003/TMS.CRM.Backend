import type { PostUserRequestPayload, PublicUser, PutUserRequestPayload } from '../api/payloads/user.js';

export interface UserTenantEntry {
  Id: number;
  UserId: number;
  TenantId: number;
  CreatedOn: string;
  ModifiedOn: string | null;
  DeletedOn: string | null;
}
