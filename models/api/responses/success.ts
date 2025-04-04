export abstract class Success {
  message: string;
  name: string;
  statusCode?: number;
  data?: any;

  constructor(message: string) {
    this.message = message;
    this.name = 'Success';
  }
}

// As API response when fetching data
export class FetchSuccess<T> extends Success {
  constructor(message: string, data?: T) {
    super(message || '');
    this.message = message;
    this.name = 'FetchSuccess';
    this.statusCode = !data ? 204 : 200;
    this.data = data;
  }
}

// As API response when deleting data
export class DeleteSuccess<T> extends Success {
  constructor(message: string, data?: T) {
    super(message || '');
    this.message = message;
    this.name = 'DeleteSuccess';
    this.statusCode = 204;
    this.data = data;
  }
}

// As API response when persisting data
export class PersistSuccess<T> extends Success {
  constructor(message: string, data?: T, statusCode?: number) {
    super(message || '');
    this.message = message;
    this.name = 'PersistSuccess';
    this.statusCode = statusCode;
    this.data = data;
  }
}
