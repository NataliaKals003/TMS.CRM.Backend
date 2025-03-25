import type { PostActivityRequestPayload, PublicActivity, PutActivityRequestPayload } from '../api/payloads/activity.js';

export interface ActivityEntry {
  Id: number;
  ExternalUuid: string;
  TenantId: number;
  DealId: string;
  Description: string;
  ActivityDate: string;
  ActivityImageUrl: string;
  CreatedOn: string;
  ModifiedOn: string | null;
  DeletedOn: string | null;
}

export class ActivityEntry implements ActivityEntry {
  public constructor(data: ActivityEntry) {
    this.Id = data.Id;
    this.ExternalUuid = data.ExternalUuid;
    this.TenantId = data.TenantId;
    this.DealId = data.DealId;
    this.Description = data.Description;
    this.ActivityDate = data.ActivityDate;
    this.ActivityImageUrl = data.ActivityImageUrl;
    this.CreatedOn = data.CreatedOn;
    this.ModifiedOn = data.ModifiedOn;
    this.DeletedOn = data.DeletedOn;
  }

  /** Convert the PostActivityRequestPayload to a Partial<ActivityEntry> */
  public static fromPostRequestPayload(payload: PostActivityRequestPayload): Partial<ActivityEntry> {
    return {
      Description: payload.description,
      ActivityDate: payload.activityDate,
      ActivityImageUrl: payload.activityImageUrl,
    };
  }

  /** Convert the PutActivityRequestPayload to a Partial<ActivityEntry> */
  public static fromPutRequestPayload(payload: PutActivityRequestPayload): Partial<ActivityEntry> {
    return {
      Description: payload.description,
      ActivityDate: payload.activityDate,
      ActivityImageUrl: payload.activityImageUrl,
      ModifiedOn: new Date().toISOString(),
    };
  }

  /** Convert the ActivityEntry to a PublicActivity */
  public toPublic(): PublicActivity {
    return {
      uuid: this.ExternalUuid,
      dealId: this.DealId,
      description: this.Description,
      activityDate: this.ActivityDate,
      activityImageUrl: this.ActivityImageUrl,
      createdOn: this.CreatedOn,
      modifiedOn: this.ModifiedOn ?? null,
      deletedOn: this.ModifiedOn ?? null,
    };
  }
}
