import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getErrorMessage(error: unknown): string {
  // Handle string errors
  if (typeof error === "string") {
    return error
  }

  // Handle null or undefined
  if (error == null) {
    return "Unknown error"
  }

  // Handle objects with error property (like API responses)
  if (typeof error === "object" && "error" in error) {
    const errorProp = (error as Record<string, unknown>).error
    if (typeof errorProp === "string") {
      return errorProp
    }
  }

  // Handle objects with message property (like Error objects)
  if (typeof error === "object" && "message" in error) {
    const messageProp = (error as Record<string, unknown>).message
    if (typeof messageProp === "string") {
      return messageProp
    }
  }

  // Default fallback
  return "Unknown error"
}
