import { ErrorCodes } from "./errorCodes.js";

export class ApiError extends Error {
  constructor(statusCode, message, options = {}) {
    super(message);
    this.statusCode = statusCode;
    this.code = options.code || ErrorCodes.INTERNAL_ERROR;
    this.errors = options.errors || [];
    this.success = false;
  }
}
