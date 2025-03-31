import type { integer } from 'aws-sdk/clients/cloudfront.js';
import type { text } from 'aws-sdk/clients/customerprofiles.js';
import type { PostDealRequestPayload, PublicDeal, PutDealRequestPayload } from '../api/payloads/deal.js';
import type { CustomerEntry } from './customerEntry.js';

export enum DealProgress {
  InProgress = 'inProgress',
  Pending = 'pending',
  Closed = 'closed',
}

export enum RoomAccess {
  KeysWithDoorman = 'keysWithDoorman',
  KeysInLockbox = 'keysInLockbox',
  KeysObtained = 'keysObtained',
  KeysNotRequired = 'keysNotRequired',
  Other = 'other',
}

/** Represents the Deal entry in the database */
export interface DealEntry {
  Id: number;
  ExternalUuid: string;
  TenantId: number;
  CustomerId: number;
  ImageUrl: string;
  Street: text;
  City: text;
  State: text;
  ZipCode: text;
  RoomArea: number;
  Price: number;
  NumberOfPeople: integer;
  AppointmentDate: string;
  Progress: DealProgress;
  SpecialInstructions: string;
  RoomAccess: RoomAccess;
  CreatedOn: string;
  ModifiedOn: string | null;
  DeletedOn: string | null;
}

/** Extended DealEntry with Customer information */
export interface ExtendedDealEntry extends DealEntry {
  Customer: Pick<CustomerEntry, 'ExternalUuid' | 'FirstName' | 'LastName' | 'Email' | 'Phone' | 'ImageUrl'>;
}

export class DealEntry implements DealEntry {
  public constructor(data: DealEntry) {
    this.Id = data.Id;
    this.ExternalUuid = data.ExternalUuid;
    this.TenantId = data.TenantId;
    this.CustomerId = data.CustomerId;
    this.ImageUrl = data.ImageUrl;
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
  public static fromPostRequestPayload(payload: PostDealRequestPayload, customerId: number): Partial<DealEntry> {
    return {
      Price: payload.price,
      Street: payload.street,
      City: payload.city,
      State: payload.state,
      ZipCode: payload.zipCode,
      ImageUrl: payload.dealImageUrl,
      RoomArea: payload.roomArea,
      NumberOfPeople: payload.numberOfPeople,
      AppointmentDate: payload.appointmentDate,
      Progress: payload.progress,
      SpecialInstructions: payload.specialInstructions,
      RoomAccess: payload.roomAccess,
      CustomerId: customerId,
    };
  }

  /** Convert the PutDealRequestPayload to a Partial<DealEntry> */
  public static fromPutRequestPayload(payload: PutDealRequestPayload): Partial<DealEntry> {
    return {
      Price: payload.price,
      Street: payload.street,
      City: payload.city,
      State: payload.state,
      ZipCode: payload.zipCode,
      ImageUrl: payload.dealImageUrl,
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
  public constructor(data: Record<string, any>) {
    this.Id = data.Id;
    this.ExternalUuid = data.ExternalUuid;
    this.TenantId = data.TenantId;
    this.CustomerId = data.CustomerId;
    this.Customer = {
      ExternalUuid: data.CustomerExternalUuid,
      FirstName: data.CustomerFirstName,
      LastName: data.CustomerLastName,
      Email: data.CustomerEmail,
      Phone: data.CustomerPhone,
      ImageUrl: data.CustomerImageUrl,
    };
    this.Price = data.Price;
    this.Street = data.Street;
    this.City = data.City;
    this.State = data.State;
    this.ZipCode = data.ZipCode;
    this.ImageUrl = data.ImageUrl;
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
  public toPublic(): PublicDeal {
    return {
      uuid: this.ExternalUuid,
      customer: {
        uuid: this.Customer.ExternalUuid,
        customerImageUrl: this.Customer.ImageUrl ?? null,
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
      dealImageUrl: this.ImageUrl,
      roomArea: this.RoomArea,
      numberOfPeople: this.NumberOfPeople,
      appointmentDate: this.AppointmentDate,
      progress: this.Progress,
      specialInstructions: this.SpecialInstructions,
      roomAccess: this.RoomAccess,
      createdOn: this.CreatedOn,
      modifiedOn: this.ModifiedOn ?? null,
      deletedOn: this.DeletedOn ?? null,
    };
  }
}
