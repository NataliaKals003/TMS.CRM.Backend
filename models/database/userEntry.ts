import type { PostUserRequestPayload, PublicUser, PutUserRequestPayload } from '../api/payloads/user.js';

export interface UserEntry {
  Id: number;
  ExternalUuid: string;
  FirstName: string;
  LastName: string;
  Email: string;
  CreatedOn: string;
  ModifiedOn: string | null;
  DeletedOn: string | null;
}

export class UserEntry implements UserEntry {
  public constructor(data: UserEntry) {
    this.Id = data.Id;
    this.ExternalUuid = data.ExternalUuid;
    this.FirstName = data.FirstName;
    this.LastName = data.LastName;
    this.Email = data.Email;
    this.CreatedOn = data.CreatedOn;
    this.ModifiedOn = data.ModifiedOn;
    this.DeletedOn = data.DeletedOn;
  }

  /** Convert the PostUserRequestPayload to a Partial<UserEntry> */
  public static fromPostRequestPayload(payload: PostUserRequestPayload): Partial<UserEntry> {
    return {
      FirstName: payload.firstName,
      LastName: payload.lastName,
      Email: payload.email,
    };
  }

  /** Convert the PutUserRequestPayload to a Partial<UserEntry> */
  public static fromPutRequestPayload(payload: PutUserRequestPayload): Partial<UserEntry> {
    return {
      FirstName: payload.firstName,
      LastName: payload.lastName,
      Email: payload.email,
      ModifiedOn: new Date().toISOString(),
    };
  }

  /** Convert the UserEntry to a PublicUser */
  public toPublic(): PublicUser {
    return {
      uuid: this.ExternalUuid,
      firstName: this.FirstName,
      lastName: this.LastName,
      email: this.Email,
      createdOn: this.CreatedOn,
      modifiedOn: this.ModifiedOn ?? null,
    };
  }
}
