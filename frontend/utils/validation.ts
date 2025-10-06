// Validation utilities

import { ValidationRule, FormErrors } from '../types';
import { VALIDATION_RULES } from '../constants';

export const validators = {
  required: (value: string | number): string | null => {
    if (typeof value === 'string') {
      return value.trim() ? null : "Ez a mező kötelező";
    }
    return value !== undefined && value !== null ? null : "Ez a mező kötelező";
  },

  minLength: (min: number) => (value: string): string | null => {
    return value.length >= min ? null : `Legalább ${min} karakter szükséges`;
  },

  maxLength: (max: number) => (value: string): string | null => {
    return value.length <= max ? null : `Legfeljebb ${max} karakter engedélyezett`;
  },

  email: (value: string): string | null => {
    // Accept both email format and simple usernames
    if (value.includes(' ')) {
      return "Az email/bejelentkezési név nem tartalmazhat szóközöket";
    }
    if (value.length < 3) {
      return "Az email/bejelentkezési név legalább 3 karakter hosszú kell legyen";
    }
    return null;
  },

  noSpaces: (value: string): string | null => {
    return !value.includes(' ') ? null : "Ez a mező nem tartalmazhat szóközöket";
  }
};

export const validateField = (value: any, rules: ValidationRule): string | null => {
  // Check required
  if (rules.required) {
    const requiredError = validators.required(value);
    if (requiredError) return requiredError;
  }

  // If empty and not required, skip other validations
  if (!value || (typeof value === 'string' && !value.trim())) {
    return null;
  }

  // Check minLength
  if (rules.minLength && typeof value === 'string') {
    const minLengthError = validators.minLength(rules.minLength)(value);
    if (minLengthError) return minLengthError;
  }

  // Check maxLength
  if (rules.maxLength && typeof value === 'string') {
    const maxLengthError = validators.maxLength(rules.maxLength)(value);
    if (maxLengthError) return maxLengthError;
  }

  // Check pattern
  if (rules.pattern && typeof value === 'string') {
    return rules.pattern.test(value) ? null : "Érvénytelen formátum";
  }

  // Check custom validation
  if (rules.custom) {
    return rules.custom(value);
  }

  return null;
};

export const validateForm = <T extends Record<string, any>>(
  values: T, 
  rules: Record<keyof T, ValidationRule>
): FormErrors => {
  const errors: FormErrors = {};

  for (const field in rules) {
    const error = validateField(values[field], rules[field]);
    if (error) {
      errors[field] = error;
    }
  }

  return errors;
};

// Pre-configured validation rules for common fields
export const getValidationRules = () => ({
  name: {
    required: true,
    minLength: VALIDATION_RULES.name.minLength,
    maxLength: VALIDATION_RULES.name.maxLength
  },
  email: {
    required: true,
    custom: validators.email
  },
  password: {
    required: true,
    minLength: VALIDATION_RULES.password.minLength,
    maxLength: VALIDATION_RULES.password.maxLength
  },
  title: {
    required: true,
    minLength: VALIDATION_RULES.title.minLength,
    maxLength: VALIDATION_RULES.title.maxLength
  },
  description: {
    required: true,
    minLength: VALIDATION_RULES.description.minLength,
    maxLength: VALIDATION_RULES.description.maxLength
  }
});