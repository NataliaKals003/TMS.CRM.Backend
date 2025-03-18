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

  withFirstName(value: string): this {
    this.tenantEntry.FirstName = value;
    return this;
  }

  withLastName(value: string): this {
    this.tenantEntry.LastName = value;
    return this;
  }

  withEmail(value: string): this {
    this.tenantEntry.Email = value;
    return this;
  }

  build(): TenantEntry {
    return this.tenantEntry;
  }

  static make(): TenantEntryBuilder {
    return new TenantEntryBuilder();
  }
}
