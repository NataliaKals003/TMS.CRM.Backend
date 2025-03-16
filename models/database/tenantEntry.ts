export interface TenantEntry {
  Id: number;
  ExternalUuid: string;
  Name: string;
  CreatedOn: string;
  ModifiedOn: string | null;
  DeletedOn: string | null;
}
