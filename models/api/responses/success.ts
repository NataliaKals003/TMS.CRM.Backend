class Success {
  name: string;
  message: string;
  data?: any;
  statusCode: number;

  constructor(message: string, data?: any) {
    this.message = message;
    this.name = 'Success';
    this.statusCode = 200;
    this.data = data;
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

export class DeleteSuccess<T> extends Success {
  constructor(message: string, data?: T) {
    super(message || '');
    this.message = message;
    this.name = 'DeleteSuccess';
    this.statusCode = !data ? 204 : 200;
    this.data = data;
  }
}

// As API response when persisting data
export class PersistSuccess<T> extends Success {
  constructor(message: string, data?: T) {
    super(message || '');
    this.message = message;
    this.name = 'PersistSuccess';
    this.statusCode = 201;
    this.data = data;
  }
}
