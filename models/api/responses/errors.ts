export abstract class HttpError extends Error {
  protected statusCode?: number;
}

export class BadRequestError extends HttpError {
  constructor(message: string) {
    super(message || '');
    this.message = message;
    this.name = 'BadRequestError';
    this.statusCode = 400;
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message: string) {
    super(message || '');
    this.message = message;
    this.name = 'UnauthorizedError';
    this.statusCode = 401;
  }
}

export class ConflictError extends HttpError {
  constructor(message: string) {
    super(message || '');
    this.message = message;
    this.name = 'ConflictError';
    this.statusCode = 409;
  }
}

export class InternalError extends HttpError {
  constructor(message: string) {
    super(message || '');
    this.message = message;
    this.name = 'InternalServerError';
    this.statusCode = 500;
  }
}
