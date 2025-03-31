import { randomUUID } from 'crypto';
import type { ActivityEntry } from '../../models/database/activityEntry.js';

export class ActivityEntryBuilder {
  private activityEntry: ActivityEntry;

  private constructor() {
    this.activityEntry = {
      ExternalUuid: randomUUID(),
      CreatedOn: new Date(Date.now() - 86400000), // 24 hrs
    } as any as ActivityEntry;
  }

  withTenantId(value: number): this {
    this.activityEntry.TenantId = value;
    return this;
  }

  withDealId(value: number): this {
    this.activityEntry.DealId = value;
    return this;
  }

  withDescription(value: string): this {
    this.activityEntry.Description = value;
    return this;
  }

  withActivityDate(value: string): this {
    this.activityEntry.ActivityDate = value;
    return this;
  }

  withActivityImageUrl(value: string): this {
    this.activityEntry.ImageUrl = value;
    return this;
  }

  build(): ActivityEntry {
    return this.activityEntry;
  }

  static make(): ActivityEntryBuilder {
    return new ActivityEntryBuilder();
  }
}
