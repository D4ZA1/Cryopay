import { ZodError } from "zod";
import { ErrorCode } from "@/constants";

/**
 * Central mapping of error codes to friendly messages
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.INVALID_CREDENTIALS]: "Invalid credentials, please check your username and password.",
  [ErrorCode.EMAIL_EXISTS]: "An account with this email already exists.",
  [ErrorCode.USER_NOT_FOUND]: "User not found.",
  [ErrorCode.INVALID_TOKEN]: "Authentication token is invalid.",
  [ErrorCode.TOKEN_EXPIRED]: "Your session has expired.",
  [ErrorCode.MFA_REQUIRED]: "Multi-factor authentication required.",
  [ErrorCode.MFA_INVALID]: "Invalid multi-factor authentication code.",
  [ErrorCode.VALIDATION_ERROR]: "Some data is invalid, please check.",
  [ErrorCode.INVALID_EMAIL]: "Email address is invalid.",
  [ErrorCode.WEAK_PASSWORD]: "Password does not meet strength requirements.",
  [ErrorCode.MISSING_REQUIRED_FIELD]: "A required field is missing.",
  [ErrorCode.NOT_FOUND]: "Resource not found.",
  [ErrorCode.ALREADY_EXISTS]: "Resource already exists.",
  [ErrorCode.UNAUTHORIZED]: "Unauthorized.",
  [ErrorCode.FORBIDDEN]: "Forbidden.",
  [ErrorCode.INTERNAL_ERROR]: "Internal server error.",
  [ErrorCode.DATABASE_ERROR]: "Database error.",
  [ErrorCode.CONTACT_ADD_FAILED]: "Failed to add contact. Please try again.",
  [ErrorCode.CONTACT_UPDATE_FAILED]: "Failed to update contact. Please try again.",
  [ErrorCode.CONTACT_DELETE_FAILED]: "Failed to delete contact. Please try again.",
  [ErrorCode.CONTACT_INVALID_PUBLIC_KEY]: "The public key provided is invalid.",
  [ErrorCode.CONTACT_NOT_FOUND]: "Contact not found."
};

/**
 * Utility to get an error code and message from a Zod validation error
 */
export function mapZodErrorToErrorCode(error: ZodError): { code: ErrorCode; message: string } {
  // Always treat as validation error, but provide top-level field message
  const firstIssue = error.issues.length ? error.issues[0] : undefined;
  let code = ErrorCode.VALIDATION_ERROR;
  let message = ERROR_MESSAGES[ErrorCode.VALIDATION_ERROR];

  if (firstIssue) {
    // Special-case email and required field
    if (firstIssue.code === "invalid_type" && firstIssue.path.includes("email")) {
      code = ErrorCode.INVALID_EMAIL;
      message = ERROR_MESSAGES[ErrorCode.INVALID_EMAIL];
    } else if (firstIssue.code === "invalid_type" || firstIssue.code === "too_small") {
      code = ErrorCode.MISSING_REQUIRED_FIELD;
      message = ERROR_MESSAGES[ErrorCode.MISSING_REQUIRED_FIELD];
    } else if (firstIssue.code === "custom") {
      // Zod custom errors get their own message
      message = firstIssue.message;
    }
  }
  return { code, message };
}

/**
 * Given an error code or Zod error, return a user-friendly error message
 */
export function getErrorMessageFromCodeOrZod(error: unknown): string {
  // Zod error
  if (error instanceof ZodError) {
    return mapZodErrorToErrorCode(error).message;
  }
  // Error code
  if (typeof error === "string" && (error as ErrorCode) in ERROR_MESSAGES) {
    return ERROR_MESSAGES[error as ErrorCode];
  }
  // Fallback: use generic util
  return typeof error === "string" ? error : ERROR_MESSAGES[ErrorCode.INTERNAL_ERROR];
}

/**
 * Parse error from HTTP response - handles JSON with error/message fields
 */
export function parseApiError(rawText: string): string {
  try {
    const parsed = JSON.parse(rawText);
    if (parsed.error && typeof parsed.error === "string") {
      return parsed.error;
    }
    if (parsed.message && typeof parsed.message === "string") {
      return parsed.message;
    }
  } catch {
    // Not JSON
  }
  return rawText || "Request failed";
}
