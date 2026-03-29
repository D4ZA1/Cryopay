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
 * Represents a parsed Zod validation error item from the backend
 * This matches the Standard Schema format that Zod v4 uses
 */
interface ZodErrorItem {
  origin?: string;
  code?: string;
  format?: string;
  path?: (string | number)[];
  message?: string;
  minimum?: number;
  inclusive?: boolean;
}

/**
 * Utility to get an error code and message from a Zod validation error
 */
export function mapZodErrorToErrorCode(error: ZodError): { code: ErrorCode; message: string } {
  // Always treat as validation error, but provide top-level field message
  const firstIssue = error.issues.length ? error.issues[0] : undefined;
  let code = ErrorCode.VALIDATION_ERROR;
  let message = ERROR_MESSAGES[ErrorCode.VALIDATION_ERROR];

  if (firstIssue) {
    const issueCode = firstIssue.code as string;
    const pathStr = firstIssue.path.map(String);
    
    // Handle invalid_format code (from Standard Schema / Zod v4)
    if (issueCode === "invalid_format") {
      const format = "format" in firstIssue ? (firstIssue as { format?: string }).format : undefined;
      if (format === "email" || pathStr.includes("email")) {
        code = ErrorCode.INVALID_EMAIL;
        message = ERROR_MESSAGES[ErrorCode.INVALID_EMAIL];
      }
    }
    // Special-case email field with invalid_type
    else if (issueCode === "invalid_type" && pathStr.includes("email")) {
      code = ErrorCode.INVALID_EMAIL;
      message = ERROR_MESSAGES[ErrorCode.INVALID_EMAIL];
    }
    // Handle missing/empty required fields
    else if (issueCode === "invalid_type" || issueCode === "too_small") {
      code = ErrorCode.MISSING_REQUIRED_FIELD;
      message = ERROR_MESSAGES[ErrorCode.MISSING_REQUIRED_FIELD];
    }
    // Zod custom errors get their own message
    else if (issueCode === "custom") {
      message = firstIssue.message;
    }
  }
  return { code, message };
}

/**
 * Maps a Zod error code string (from backend) to an ErrorCode
 * Handles all Zod v4 Standard Schema error codes
 */
export function mapZodErrorCodeString(
  errorCode: string | undefined,
  format?: string,
  path?: (string | number)[]
): ErrorCode {
  const pathStr = path?.map(String) ?? [];
  
  // Handle format-based validation errors (email, url, uuid, etc.)
  if (errorCode === "invalid_format") {
    if (format === "email" || pathStr.includes("email")) {
      return ErrorCode.INVALID_EMAIL;
    }
    // Generic validation error for other formats (url, uuid, etc.)
    return ErrorCode.VALIDATION_ERROR;
  }

  // Handle other Zod error codes
  switch (errorCode) {
    case "invalid_type":
    case "invalid_value":
      if (pathStr.includes("email")) {
        return ErrorCode.INVALID_EMAIL;
      }
      return ErrorCode.MISSING_REQUIRED_FIELD;
    case "too_small":
    case "too_big":
    case "not_multiple_of":
      return ErrorCode.MISSING_REQUIRED_FIELD;
    case "invalid_key":
    case "invalid_element":
    case "unrecognized_keys":
    case "invalid_union":
    case "custom":
    default:
      return ErrorCode.VALIDATION_ERROR;
  }
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
 * Also handles stringified JSON arrays from Zod validation errors
 */
export function parseApiError(rawText: string): string {
  if (!rawText || typeof rawText !== "string") {
    return "Request failed";
  }

  try {
    const parsed = JSON.parse(rawText);
    
    // Handle direct array of error objects
    if (Array.isArray(parsed)) {
      return extractMessagesFromErrorArray(parsed);
    }
    
    // Handle object with error field
    if (parsed.error) {
      // Error field might be a stringified JSON array
      if (typeof parsed.error === "string") {
        const errorMessages = tryParseErrorString(parsed.error);
        if (errorMessages) {
          return errorMessages;
        }
        return parsed.error;
      }
      // Error field might be an array directly
      if (Array.isArray(parsed.error)) {
        return extractMessagesFromErrorArray(parsed.error);
      }
    }
    
    // Handle object with message field
    if (parsed.message && typeof parsed.message === "string") {
      const errorMessages = tryParseErrorString(parsed.message);
      if (errorMessages) {
        return errorMessages;
      }
      return parsed.message;
    }
    
    // Handle object with messages array
    if (Array.isArray(parsed.messages)) {
      const messages = parsed.messages
        .filter((m: unknown): m is string => typeof m === "string")
        .filter(Boolean);
      if (messages.length > 0) {
        return messages.join(". ");
      }
    }
  } catch {
    // Not valid JSON, check if rawText looks like a JSON array string
    const errorMessages = tryParseErrorString(rawText);
    if (errorMessages) {
      return errorMessages;
    }
  }
  
  return rawText.trim() || "Request failed";
}

/**
 * Attempts to parse a string as a JSON array of error objects
 * Returns the extracted messages joined, or null if not parseable
 */
function tryParseErrorString(str: string): string | null {
  if (!str || typeof str !== "string") {
    return null;
  }
  
  const trimmed = str.trim();
  
  // Quick check: does it look like a JSON array?
  if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) {
    return null;
  }
  
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return extractMessagesFromErrorArray(parsed);
    }
  } catch {
    // Not valid JSON
  }
  
  return null;
}

/**
 * Type guard to check if an object matches ZodErrorItem structure
 */
function isZodErrorItem(obj: unknown): obj is ZodErrorItem {
  return (
    typeof obj === "object" &&
    obj !== null &&
    ("message" in obj || "code" in obj)
  );
}

/**
 * Extracts message fields from an array of error objects
 * Handles ZodErrorItem format and other common error formats
 */
function extractMessagesFromErrorArray(errors: unknown[]): string {
  const messages: string[] = [];
  
  for (const error of errors) {
    if (typeof error === "string") {
      // Plain string error
      messages.push(error);
    } else if (isZodErrorItem(error)) {
      // ZodErrorItem from backend validation
      if (error.message) {
        messages.push(error.message);
      }
    } else if (error && typeof error === "object") {
      const errorObj = error as Record<string, unknown>;
      
      // Try common message field names in order of preference
      const message = 
        (typeof errorObj.message === "string" && errorObj.message) ||
        (typeof errorObj.msg === "string" && errorObj.msg) ||
        (typeof errorObj.error === "string" && errorObj.error) ||
        (typeof errorObj.detail === "string" && errorObj.detail);
      
      if (message) {
        messages.push(message);
      }
    }
  }
  
  if (messages.length === 0) {
    return "Validation error";
  }
  
  // Join with period and space, ensuring proper sentence formatting
  return messages
    .map(m => m.trim())
    .filter(Boolean)
    .map(m => m.endsWith(".") ? m.slice(0, -1) : m) // Remove trailing periods
    .join(". ") + "."; // Add single period at end
}
