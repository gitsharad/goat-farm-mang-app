/**
 * Input validation utilities
 */

// Common validation patterns
const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[0-9\s-]{10,20}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  name: /^[a-zA-Z\s'-]+$/,
  numeric: /^[0-9]+(\.\d{1,2})?$/,
  date: /^\d{4}-\d{2}-\d{2}$/,
  url: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
};

// Validation rules for different input types
const validators = {
  required: (value) => ({
    isValid: !!value && String(value).trim().length > 0,
    message: 'This field is required',
  }),
  
  email: (value) => ({
    isValid: patterns.email.test(value),
    message: 'Please enter a valid email address',
  }),
  
  phone: (value) => ({
    isValid: patterns.phone.test(value),
    message: 'Please enter a valid phone number',
  }),
  
  password: (value) => ({
    isValid: patterns.password.test(value),
    message: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character',
  }),
  
  minLength: (min) => (value) => ({
    isValid: String(value).length >= min,
    message: `Must be at least ${min} characters long`,
  }),
  
  maxLength: (max) => (value) => ({
    isValid: String(value).length <= max,
    message: `Must be less than ${max} characters`,
  }),
  
  numeric: (value) => ({
    isValid: patterns.numeric.test(value),
    message: 'Must be a valid number',
  }),
  
  minValue: (min) => (value) => ({
    isValid: Number(value) >= min,
    message: `Value must be at least ${min}`,
  }),
  
  maxValue: (max) => (value) => ({
    isValid: Number(value) <= max,
    message: `Value must be less than or equal to ${max}`,
  }),
  
  date: (value) => ({
    isValid: patterns.date.test(value) && !isNaN(Date.parse(value)),
    message: 'Please enter a valid date (YYYY-MM-DD)',
  }),
  
  url: (value) => ({
    isValid: patterns.url.test(value),
    message: 'Please enter a valid URL',
  }),
  
  oneOf: (options) => (value) => ({
    isValid: options.includes(value),
    message: `Must be one of: ${options.join(', ')}`,
  }),
};

/**
 * Validate input against specified rules
 * @param {*} value - The value to validate
 * @param {Array} rules - Array of validation rules to apply
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
const validate = (value, rules = []) => {
  if (!Array.isArray(rules)) {
    rules = [rules];
  }

  const errors = [];
  let isValid = true;

  for (const rule of rules) {
    if (typeof rule === 'string' && validators[rule]) {
      const result = validators[rule](value);
      if (!result.isValid) {
        isValid = false;
        errors.push(result.message);
      }
    } else if (typeof rule === 'function') {
      const result = rule(value);
      if (!result.isValid) {
        isValid = false;
        errors.push(result.message);
      }
    } else if (rule && typeof rule === 'object') {
      for (const [ruleName, ruleValue] of Object.entries(rule)) {
        if (validators[ruleName]) {
          const validator = validators[ruleName](ruleValue);
          const result = validator(value);
          if (!result.isValid) {
            isValid = false;
            errors.push(result.message);
          }
        }
      }
    }
  }

  return { isValid, errors };
};

/**
 * Create a form validator
 * @param {Object} schema - Validation schema { field: rules }
 * @returns {Function} - validateForm function
 */
const createValidator = (schema) => {
  return (values) => {
    const errors = {};
    let isValid = true;

    for (const [field, rules] of Object.entries(schema)) {
      const value = values[field];
      const result = validate(value, rules);
      
      if (!result.isValid) {
        isValid = false;
        errors[field] = result.errors[0]; // Return first error only
      }
    }

    return { isValid, errors };
  };
};

// Example usage:
/*
const loginSchema = {
  email: ['required', 'email'],
  password: ['required', 'minLength:8'],
};

const validateLogin = createValidator(loginSchema);
const { isValid, errors } = validateLogin({ email: 'test@example.com', password: '123' });
*/

export {
  validate,
  createValidator,
  validators,
  patterns,
};
