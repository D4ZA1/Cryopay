/**
 * CryoPay Frontend Types and Zod Validation Schemas
 * 
 * This module provides comprehensive type definitions and runtime validation
 * schemas for the CryoPay crypto wallet application.
 * 
 * @module types
 * @example
 * ```typescript
 * import { 
 *   LoginInputSchema, 
 *   type LoginInput, 
 *   type Transaction 
 * } from '@/types';
 * 
 * // Validate login input
 * const result = LoginInputSchema.safeParse({ email, password });
 * if (result.success) {
 *   // result.data is typed as LoginInput
 * }
 * ```
 */

export * from './schemas';
