import type { PostDealRequestPayload, PublicDeal, PutDealRequestPayload } from '../api/payloads/deal.js';
import type { CustomerEntry } from './customerEntry.js';

export enum DealProgress {
  InProgress = 'InProgress',
  Pending = 'Pending',
  Closed = 'Closed',
}

export enum RoomAccess {
  KeysWithDoorman = 'KeysWithDoorman',
  KeysInLockbox = 'KeysInLockbox',
  KeysObtained = 'KeysObtained',
  KeysNotRequired = 'KeysNotRequired',
  Other = 'Other',
}

/** Represents the Deal entry in the database */
export interface DealEntry {
  Id: number;
  ExternalUuid: string;
  TenantId: number;
  CustomerId: string;
  DealImageUrl: string | null;
  Street: string;
  City: string;
  State: string;
  ZipCode: string;
  RoomArea: string | null;
  Price: string;
  NumberOfPeople: string | null;
  AppointmentDate: string;
  Progress: DealProgress;
  SpecialInstructions: string | null;
  RoomAccess: RoomAccess;
  CreatedOn: string;
  ModifiedOn: string | null;
  DeletedOn: string | null;
}

/** Extended DealEntry with Customer information */
export interface ExtendedDealEntry extends DealEntry {
  Customer: Pick<CustomerEntry, 'ExternalUuid' | 'FirstName' | 'LastName' | 'Email' | 'Phone' | 'CustomerImageUrl'>;
}

export class DealEntry implements DealEntry {
  public constructor(data: DealEntry) {
    this.Id = data.Id;
    this.ExternalUuid = data.ExternalUuid;
    this.TenantId = data.TenantId;
    this.CustomerId = data.CustomerId;
    this.DealImageUrl = data.DealImageUrl;
    this.Street = data.Street;
    this.City = data.City;
    this.State = data.State;
    this.ZipCode = data.ZipCode;
    this.RoomArea = data.RoomArea;
    this.Price = data.Price;
    this.NumberOfPeople = data.NumberOfPeople;
    this.AppointmentDate = data.AppointmentDate;
    this.Progress = data.Progress;
    this.SpecialInstructions = data.SpecialInstructions;
    this.RoomAccess = data.RoomAccess;
    this.CreatedOn = data.CreatedOn;
    this.ModifiedOn = data.ModifiedOn;
    this.DeletedOn = data.DeletedOn;
  }

  /** Convert the PostDealRequestPayload to a Partial<DealEntry> */
  public static fromPostRequestPayload(payload: PostDealRequestPayload): Partial<DealEntry> {
    return {
      CustomerId: payload.customerUuid,
      Price: payload.price,
      Street: payload.street,
      City: payload.city,
      State: payload.state,
      ZipCode: payload.zipCode,
      DealImageUrl: payload.dealImageUrl,
      RoomArea: payload.roomArea,
      NumberOfPeople: payload.numberOfPeople,
      AppointmentDate: payload.appointmentDate,
      Progress: payload.progress,
      SpecialInstructions: payload.specialInstructions,
      RoomAccess: payload.roomAccess,
    };
  }

  /** Convert the PutDealRequestPayload to a Partial<DealEntry> */
  public static fromPutRequestPayload(payload: PutDealRequestPayload): Partial<DealEntry> {
    return {
      CustomerId: payload.customerUuid,
      Price: payload.price,
      Street: payload.street,
      City: payload.city,
      State: payload.state,
      ZipCode: payload.zipCode,
      DealImageUrl: payload.dealImageUrl,
      RoomArea: payload.roomArea,
      NumberOfPeople: payload.numberOfPeople,
      AppointmentDate: payload.appointmentDate,
      Progress: payload.progress,
      SpecialInstructions: payload.specialInstructions,
      RoomAccess: payload.roomAccess,
      ModifiedOn: new Date().toISOString(),
    };
  }
}

export class ExtendedDealEntry implements ExtendedDealEntry {
  public constructor(data: ExtendedDealEntry) {
    this.Id = data.Id;
    this.ExternalUuid = data.ExternalUuid;
    this.TenantId = data.TenantId;
    this.CustomerId = data.CustomerId;
    this.Customer = data.Customer;
    this.Price = data.Price;
    this.Street = data.Street;
    this.City = data.City;
    this.State = data.State;
    this.ZipCode = data.ZipCode;
    this.DealImageUrl = data.DealImageUrl;
    this.RoomArea = data.RoomArea;
    this.NumberOfPeople = data.NumberOfPeople;
    this.AppointmentDate = data.AppointmentDate;
    this.Progress = data.Progress;
    this.SpecialInstructions = data.SpecialInstructions;
    this.RoomAccess = data.RoomAccess;
    this.CreatedOn = data.CreatedOn;
    this.ModifiedOn = data.ModifiedOn;
    this.DeletedOn = data.DeletedOn;
  }

  /** Convert the ExtendedDealEntry to a PublicDeal */
  public async toPublic(): Promise<PublicDeal> {
    return {
      uuid: this.ExternalUuid,
      customer: {
        uuid: this.Customer.ExternalUuid,
        customerImageUrl: this.Customer.CustomerImageUrl ?? null,
        firstName: this.Customer.FirstName,
        lastName: this.Customer.LastName,
        email: this.Customer.Email,
        phone: this.Customer.Phone,
      },
      price: this.Price,
      street: this.Street,
      city: this.City,
      state: this.State,
      zipCode: this.ZipCode,
      dealImageUrl: String(this.DealImageUrl),
      roomArea: String(this.RoomArea),
      numberOfPeople: String(this.NumberOfPeople),
      appointmentDate: this.AppointmentDate,
      progress: this.Progress,
      specialInstructions: String(this.SpecialInstructions),
      roomAccess: this.RoomAccess,
      createdOn: this.CreatedOn,
      modifiedOn: this.ModifiedOn ?? null,
      deletedOn: this.DeletedOn ?? null,
    };
  }
}
