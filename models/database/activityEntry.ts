import type { PostActivityRequestPayload, PublicActivity, PutActivityRequestPayload } from '../api/payloads/activity.js';
import type { DealEntry } from './dealEntry.js';

export interface ActivityEntry {
  Id: number;
  ExternalUuid: string;
  TenantId: number;
  DealId: number;
  Description: string;
  Date: string;
  ImageUrl: string;
  CreatedOn: string;
  ModifiedOn: string | null;
  DeletedOn: string | null;
}

/** Extended ActivityEntry with Deal information */
export interface ExtendedActivityEntry extends ActivityEntry {
  Deal: Pick<DealEntry, 'ExternalUuid'>;
}

export class ActivityEntry implements ActivityEntry {
  public constructor(data: ActivityEntry) {
    this.Id = data.Id;
    this.ExternalUuid = data.ExternalUuid;
    this.TenantId = data.TenantId;
    this.DealId = data.DealId;
    this.Description = data.Description;
    this.Date = data.Date;
    this.ImageUrl = data.ImageUrl;
    this.CreatedOn = data.CreatedOn;
    this.ModifiedOn = data.ModifiedOn;
    this.DeletedOn = data.DeletedOn;
  }

  /** Convert the PostActivityRequestPayload to a Partial<ActivityEntry> */
  public static fromPostRequestPayload(payload: PostActivityRequestPayload, dealId: number): Partial<ActivityEntry> {
    return {
      DealId: dealId,
      Description: payload.description,
      Date: payload.date,
      ImageUrl: payload.imageUrl,
    };
  }

  /** Convert the PutActivityRequestPayload to a Partial<ActivityEntry> */
  public static fromPutRequestPayload(payload: PutActivityRequestPayload): Partial<ActivityEntry> {
    return {
      Description: payload.description,
      Date: payload.date,
      ImageUrl: payload.imageUrl,
      ModifiedOn: new Date().toISOString(),
    };
  }
}

export class ExtendedActivityEntry implements ExtendedActivityEntry {
  public constructor(data: Record<string, any>) {
    this.Id = data.Id;
    this.ExternalUuid = data.ExternalUuid;
    this.TenantId = data.TenantId;
    this.DealId = data.DealId;
    this.Deal = { ExternalUuid: data.DealExternalUuid };
    this.Description = data.Description;
    this.Date = data.Date;
    this.ImageUrl = data.ImageUrl;
    this.CreatedOn = data.CreatedOn;
    this.ModifiedOn = data.ModifiedOn;
    this.DeletedOn = data.DeletedOn;
  }

  /** Convert the ExtendedActivityEntry to a PublicActivity */
  public toPublic(): PublicActivity {
    return {
      uuid: this.ExternalUuid,
      dealUuid: this.Deal.ExternalUuid,
      description: this.Description,
      date: this.Date,
      imageUrl: this.ImageUrl,
      createdOn: this.CreatedOn,
      modifiedOn: this.ModifiedOn ?? null,
      deletedOn: this.DeletedOn ?? null,
    };
  }
}
