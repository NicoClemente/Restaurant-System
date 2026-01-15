export class AppError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code = "APP_ERROR", status = 500) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
  }
}

export const badRequest = (message: string) =>
  new AppError(message, "BAD_REQUEST", 400);

export const unauthorized = (message = "Unauthorized") =>
  new AppError(message, "UNAUTHORIZED", 401);

export const forbidden = (message = "Forbidden") =>
  new AppError(message, "FORBIDDEN", 403);

export const notFound = (message = "Not found") =>
  new AppError(message, "NOT_FOUND", 404);
