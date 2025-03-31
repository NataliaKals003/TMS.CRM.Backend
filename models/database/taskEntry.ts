import type { PostTaskRequestPayload, PublicTask, PutTaskRequestPayload } from '../api/payloads/task.js';

export interface TaskEntry {
  Id: number;
  ExternalUuid: string;
  TenantId: number;
  Description: string;
  DueDate: string;
  Completed: boolean;
  CreatedOn: string;
  ModifiedOn: string | null;
  DeletedOn: string | null;
}

export class TaskEntry implements TaskEntry {
  public constructor(data: TaskEntry) {
    this.Id = data.Id;
    this.ExternalUuid = data.ExternalUuid;
    this.TenantId = data.TenantId;
    this.Description = data.Description;
    this.DueDate = data.DueDate;
    this.Completed = data.Completed;
    this.CreatedOn = data.CreatedOn;
    this.ModifiedOn = data.ModifiedOn;
    this.DeletedOn = data.DeletedOn;
  }

  /** Convert the PostTaskRequestPayload to a Partial<TaskEntry> */
  public static fromPostRequestPayload(payload: PostTaskRequestPayload): Partial<TaskEntry> {
    return {
      Description: payload.description,
      DueDate: payload.dueDate,
      Completed: payload.completed === 'false',
    };
  }

  /** Convert the PutTaskRequestPayload to a Partial<TaskEntry> */
  public static fromPutRequestPayload(payload: PutTaskRequestPayload): Partial<TaskEntry> {
    return {
      Description: payload.description,
      DueDate: payload.dueDate,
      Completed: payload.completed === 'true',
      ModifiedOn: new Date().toISOString(),
    };
  }

  /** Convert the TaskEntry to a PublicTask */
  public toPublic(): PublicTask {
    return {
      uuid: this.ExternalUuid,
      description: this.Description,
      dueDate: this.DueDate,
      completed: this.Completed ? 'true' : 'false',
      createdOn: this.CreatedOn,
      modifiedOn: this.ModifiedOn ?? null,
      deletedOn: this.DeletedOn ?? null,
    };
  }
}
