import { randomUUID } from 'crypto';
import type { UserEntry } from '../../models/database/userEntry.js';

export class UserEntryBuilder {
  private userEntry: UserEntry;

  private constructor() {
    this.userEntry = {
      ExternalUuid: randomUUID(),
      CreatedOn: new Date(Date.now() - 86400000), // 24 hrs
    } as any as UserEntry;
  }

  withFirstName(value: string): this {
    this.userEntry.FirstName = value;
    return this;
  }

  withLastName(value: string): this {
    this.userEntry.LastName = value;
    return this;
  }

  withEmail(value: string): this {
    this.userEntry.Email = value;
    return this;
  }

  build(): UserEntry {
    return this.userEntry;
  }

  static make(): UserEntryBuilder {
    return new UserEntryBuilder();
  }
}
