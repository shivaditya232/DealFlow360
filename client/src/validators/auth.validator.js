import { z } from 'zod';

/**
 * DealFlow360 Zod Validation Schemas
 * Aligned with backend constraints in server/src/validators/auth.validator.js
 */

// Only SALES_REP is selectable via public self-signup now (Customer aside) —
// see components/auth/AccountTypeSelector.jsx.
export const USER_ROLES = ['SALES_REP'];
export const ACCOUNT_TYPES = ['INTERNAL', 'CUSTOMER'];

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// ============================================================================
// LOGIN SCHEMA
// ============================================================================

export const loginSchema = z.object({
  companySlug: z
    .string({ required_error: 'Company identifier is required.' })
    .transform((val) => val.trim())
    .pipe(z.string().min(1, 'Company identifier is required.')),

  email: z
    .string({ required_error: 'Work email is required.' })
    .transform((val) => val.trim())
    .pipe(
      z
        .string()
        .min(1, 'Work email is required.')
        .email('Please enter a valid work email address.')
    ),

  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

/**
 * Validate individual field for Login form using Zod
 */
export function validateLoginField(fieldName, value, allData = {}) {
  const testData = {
    companySlug: allData.companySlug ?? '',
    email: allData.email ?? '',
    password: allData.password ?? '',
    [fieldName]: value ?? '',
  };

  const result = loginSchema.safeParse(testData);
  if (result.success) return '';

  const issue = result.error.issues.find((err) => err.path[0] === fieldName);
  return issue ? issue.message : '';
}

/**
 * Validate entire Login form using Zod
 */
export function validateLoginForm(data) {
  const result = loginSchema.safeParse(data);
  if (result.success) {
    return { isValid: true, errors: {}, data: result.data };
  }

  const errors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (field && !errors[field]) {
      errors[field] = issue.message;
    }
  }

  return { isValid: false, errors, data: null };
}

// ============================================================================
// SIGNUP SCHEMA
// ============================================================================

export const signupSchema = z
  .object({
    fullName: z
      .string({ required_error: 'Full name is required' })
      .transform((val) => (val ? val.trim() : ''))
      .pipe(z.string().min(1, 'Full name is required')),

    companySlug: z
      .string({ required_error: 'Company identifier is required' })
      .transform((val) => (val ? val.trim().toLowerCase() : ''))
      .pipe(
        z
          .string()
          .min(2, 'Company identifier must be at least 2 characters')
          .max(60, 'Company identifier must be at most 60 characters')
          .regex(slugRegex, 'Only lowercase letters, numbers and hyphens allowed (e.g. acme-corp)')
      ),

    email: z
      .string({ required_error: 'Enter a valid email address' })
      .transform((val) => (val ? val.trim() : ''))
      .pipe(
        z
          .string()
          .min(1, 'Enter a valid email address')
          .email('Enter a valid email address')
      ),

    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters'),

    confirmPassword: z
      .string({ required_error: 'Confirm password is required' })
      .min(1, 'Confirm password is required'),

    roleKey: z
      .string({ required_error: 'Please select an account type or role' })
      .nullable()
      .refine((val) => Boolean(val), {
        message: 'Please select an account type or role',
      }),

    accountType: z.enum(ACCOUNT_TYPES).nullable().optional(),
    role: z.enum(USER_ROLES).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    // Check password match
    if (data.confirmPassword && data.password && data.confirmPassword !== data.password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passwords do not match',
        path: ['confirmPassword'],
      });
    }

    // Role check for internal accounts
    if (data.accountType === 'INTERNAL' && !data.role) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please select an internal role',
        path: ['roleKey'],
      });
    }
  });

/**
 * Validate individual field for Signup form using Zod
 */
export function validateSignupField(fieldName, value, allData = {}) {
  const testData = {
    ...allData,
    [fieldName]: value,
  };

  const result = signupSchema.safeParse(testData);
  if (result.success) return '';

  const issue = result.error.issues.find((err) => err.path[0] === fieldName);
  return issue ? issue.message : '';
}

/**
 * Validate entire Signup form using Zod
 */
export function validateSignupForm(data) {
  const result = signupSchema.safeParse(data);
  if (result.success) {
    return { isValid: true, errors: {}, data: result.data };
  }

  const errors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (field && !errors[field]) {
      errors[field] = issue.message;
    }
  }

  return { isValid: false, errors, data: null };
}
