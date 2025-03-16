import { randomUUID } from 'crypto';
import type { TenantEntry } from '../../models/database/tenantEntry.js';

export class TenantEntryBuilder {
  private tenantEntry: TenantEntry;

  private constructor() {
    this.tenantEntry = {
      ExternalUuid: randomUUID(),
      CreatedOn: new Date(Date.now() - 86400000), // 24 hrs
    } as any as TenantEntry;
  }

  withName(value: string): this {
    this.tenantEntry.Name = value;
    return this;
  }

  build(): TenantEntry {
    return this.tenantEntry;
  }

  static make(): TenantEntryBuilder {
    return new TenantEntryBuilder();
  }
}
