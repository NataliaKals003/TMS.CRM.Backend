import type { PostCustomerRequestPayload, PublicCustomer, PutCustomerRequestPayload } from '../api/payloads/customer.js';

export interface CustomerEntry {
  Id: number;
  ExternalUuid: string;
  TenantId: number;
  FirstName: string;
  LastName: string;
  Email: string;
  Phone: string;
  Street: string;
  City: string;
  State: string;
  ZipCode: string;
  ImageUrl: string;
  CreatedOn: string;
  ModifiedOn: string | null;
  DeletedOn: string | null;
}

export class CustomerEntry implements CustomerEntry {
  public constructor(data: CustomerEntry) {
    this.Id = data.Id;
    this.ExternalUuid = data.ExternalUuid;
    this.TenantId = data.TenantId;
    this.FirstName = data.FirstName;
    this.LastName = data.LastName;
    this.Email = data.Email;
    this.Phone = data.Phone;
    this.Street = data.Street;
    this.City = data.City;
    this.State = data.State;
    this.ZipCode = data.ZipCode;
    this.ImageUrl = data.ImageUrl;
    this.CreatedOn = data.CreatedOn;
    this.ModifiedOn = data.ModifiedOn;
    this.DeletedOn = data.DeletedOn;
  }

  /** Convert the PostCustomerRequestPayload to a Partial<CustomerEntry> */
  public static fromPostRequestPayload(payload: PostCustomerRequestPayload): Partial<CustomerEntry> {
    return {
      FirstName: payload.firstName,
      LastName: payload.lastName,
      Email: payload.email,
      Phone: payload.phone,
      Street: payload.street,
      City: payload.city,
      State: payload.state,
      ZipCode: payload.zipCode,
      ImageUrl: payload.customerImageUrl,
    };
  }

  /** Convert the PutCustomerRequestPayload to a Partial<CustomerEntry> */
  public static fromPutRequestPayload(payload: PutCustomerRequestPayload): Partial<CustomerEntry> {
    return {
      FirstName: payload.firstName,
      LastName: payload.lastName,
      Email: payload.email,
      Phone: payload.phone,
      Street: payload.street,
      City: payload.city,
      State: payload.state,
      ZipCode: payload.zipCode,
      ImageUrl: payload.customerImageUrl,
      ModifiedOn: new Date().toISOString(),
    };
  }

  /** Convert the CustomerEntry to a PublicCustomer */
  public toPublic(): PublicCustomer {
    return {
      uuid: this.ExternalUuid,
      firstName: this.FirstName,
      lastName: this.LastName,
      email: this.Email,
      phone: this.Phone,
      street: this.Street,
      city: this.City,
      state: this.State,
      zipCode: this.ZipCode,
      customerImageUrl: this.ImageUrl,
      createdOn: this.CreatedOn,
      modifiedOn: this.ModifiedOn ?? null,
      deletedOn: this.DeletedOn ?? null,
    };
  }
}
