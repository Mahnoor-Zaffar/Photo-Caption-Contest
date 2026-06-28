import { param } from "express-validator";
import { validate } from "./validate.middleware.js";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const validateUuidParam = (name = "id") => [
  param(name)
    .matches(UUID_REGEX)
    .withMessage(`${name} must be a valid UUID`),
  validate,
];
