export interface TenantEntry {
  Id: number;
  ExternalUuid: string;
  FirstName: string;
  LastName: string;
  Email: string;
  CreatedOn: string;
  ModifiedOn: string | null;
  DeletedOn: string | null;
}
