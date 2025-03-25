import { randomUUID } from 'crypto';
import type { CustomerEntry } from '../../models/database/customerEntry.js';
import type { DealEntry, DealProgress, RoomAccess } from '../../models/database/dealEntry.js';

export class DealEntryBuilder {
  private dealEntry: DealEntry;

  private constructor() {
    this.dealEntry = {
      ExternalUuid: randomUUID(),
      CreatedOn: new Date(Date.now() - 86400000), // 24 hrs
    } as any as DealEntry;
  }

  withTenantId(value: number): this {
    this.dealEntry.TenantId = value;
    return this;
  }

  withCustomerId(value: string): this {
    this.dealEntry.CustomerId = value;
    return this;
  }

  withStreet(value: string): this {
    this.dealEntry.Street = value;
    return this;
  }

  withCity(value: string): this {
    this.dealEntry.City = value;
    return this;
  }

  withState(value: string): this {
    this.dealEntry.State = value;
    return this;
  }

  withZipCode(value: string): this {
    this.dealEntry.ZipCode = value;
    return this;
  }

  withRoomArea(value: string): this {
    this.dealEntry.RoomArea = value;
    return this;
  }

  withPrice(value: string): this {
    this.dealEntry.Price = value;
    return this;
  }

  withNumberOfPeople(value: string): this {
    this.dealEntry.NumberOfPeople = value;
    return this;
  }

  withAppointmentDate(value: string): this {
    this.dealEntry.AppointmentDate = value;
    return this;
  }

  withProgress(value: DealProgress): this {
    this.dealEntry.Progress = value;
    return this;
  }

  withSpecialInstructions(value: string): this {
    this.dealEntry.SpecialInstructions = value;
    return this;
  }

  withRoomAccess(value: RoomAccess): this {
    this.dealEntry.RoomAccess = value;
    return this;
  }

  withDealImageUrl(value: string): this {
    this.dealEntry.DealImageUrl = value;
    return this;
  }

  build(): DealEntry {
    return this.dealEntry;
  }

  static make(): DealEntryBuilder {
    return new DealEntryBuilder();
  }
}

export class ExtendedDealEntry {}
