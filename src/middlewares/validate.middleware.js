import { validationResult } from "express-validator";
import { ApiError } from "../utils/ApiError.js";
import { ErrorCodes } from "../utils/errorCodes.js";

export const validate = (req, _res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    throw new ApiError(422, "Validation failed", {
      code: ErrorCodes.VALIDATION_FAILED,
      errors: formattedErrors,
    });
  }

  next();
};
