import { CreateClientRequest, UpdateClientRequest, SignupRequest, LoginRequest } from '../types';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone validation regex (flexible format)
const PHONE_REGEX = /^[\+]?[1-9][\d]{0,15}$/;

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Sanitize string input by trimming whitespace and removing null bytes
 */
export const sanitizeString = (input: string | undefined | null): string | undefined => {
  if (!input || typeof input !== 'string') return undefined;
  return input.trim().replace(/\0/g, '') || undefined;
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email);
};

/**
 * Validate phone format
 */
export const isValidPhone = (phone: string): boolean => {
  return PHONE_REGEX.test(phone.replace(/[\s\-\(\)]/g, ''));
};

/**
 * Validate create client request
 */
export const validateCreateClient = (data: any): ValidationResult => {
  const errors: ValidationError[] = [];

  // Sanitize inputs
  const name = sanitizeString(data.name);
  const email = sanitizeString(data.email);
  const phone = sanitizeString(data.phone);
  const address = sanitizeString(data.address);

  // Validate required fields
  if (!name) {
    errors.push({ field: 'name', message: 'Client name is required' });
  } else if (name.length < 2) {
    errors.push({ field: 'name', message: 'Client name must be at least 2 characters long' });
  } else if (name.length > 255) {
    errors.push({ field: 'name', message: 'Client name must be less than 255 characters' });
  }

  // Validate optional email
  if (email && !isValidEmail(email)) {
    errors.push({ field: 'email', message: 'Invalid email format' });
  }

  // Validate optional phone
  if (phone && !isValidPhone(phone)) {
    errors.push({ field: 'phone', message: 'Invalid phone number format' });
  }

  // Validate address length
  if (address && address.length > 1000) {
    errors.push({ field: 'address', message: 'Address must be less than 1000 characters' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate update client request
 */
export const validateUpdateClient = (data: any): ValidationResult => {
  const errors: ValidationError[] = [];

  // Sanitize inputs
  const name = sanitizeString(data.name);
  const email = sanitizeString(data.email);
  const phone = sanitizeString(data.phone);
  const address = sanitizeString(data.address);

  // At least one field must be provided for update
  if (!name && !email && !phone && !address) {
    errors.push({ field: 'general', message: 'At least one field must be provided for update' });
  }

  // Validate name if provided
  if (name !== undefined) {
    if (!name) {
      errors.push({ field: 'name', message: 'Client name cannot be empty' });
    } else if (name.length < 2) {
      errors.push({ field: 'name', message: 'Client name must be at least 2 characters long' });
    } else if (name.length > 255) {
      errors.push({ field: 'name', message: 'Client name must be less than 255 characters' });
    }
  }

  // Validate email if provided
  if (email !== undefined && email && !isValidEmail(email)) {
    errors.push({ field: 'email', message: 'Invalid email format' });
  }

  // Validate phone if provided
  if (phone !== undefined && phone && !isValidPhone(phone)) {
    errors.push({ field: 'phone', message: 'Invalid phone number format' });
  }

  // Validate address length if provided
  if (address !== undefined && address && address.length > 1000) {
    errors.push({ field: 'address', message: 'Address must be less than 1000 characters' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Sanitize client data for database insertion
 */
export const sanitizeClientData = (data: CreateClientRequest | UpdateClientRequest) => {
  return {
    name: sanitizeString(data.name),
    email: sanitizeString(data.email),
    phone: sanitizeString(data.phone),
    address: sanitizeString(data.address),
  };
};

/**
 * Validate password strength
 */
export const isValidPassword = (password: string): boolean => {
  // At least 8 characters, contains at least one letter and one number
  return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
};

/**
 * Validate signup request
 */
export const validateSignup = (data: any): ValidationResult => {
  const errors: ValidationError[] = [];

  // Sanitize inputs
  const email = sanitizeString(data.email);
  const password = data.password;
  const fullName = sanitizeString(data.fullName);
  const businessName = sanitizeString(data.businessName);

  // Validate required fields
  if (!email) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!isValidEmail(email)) {
    errors.push({ field: 'email', message: 'Invalid email format' });
  }

  if (!password) {
    errors.push({ field: 'password', message: 'Password is required' });
  } else if (!isValidPassword(password)) {
    errors.push({ 
      field: 'password', 
      message: 'Password must be at least 8 characters long and contain at least one letter and one number' 
    });
  }

  // Validate optional fields
  if (fullName && fullName.length > 255) {
    errors.push({ field: 'fullName', message: 'Full name must be less than 255 characters' });
  }

  if (businessName && businessName.length > 255) {
    errors.push({ field: 'businessName', message: 'Business name must be less than 255 characters' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate login request
 */
export const validateLogin = (data: any): ValidationResult => {
  const errors: ValidationError[] = [];

  // Sanitize inputs
  const email = sanitizeString(data.email);
  const password = data.password;

  // Validate required fields
  if (!email) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!isValidEmail(email)) {
    errors.push({ field: 'email', message: 'Invalid email format' });
  }

  if (!password) {
    errors.push({ field: 'password', message: 'Password is required' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Sanitize auth data for processing
 */
export const sanitizeAuthData = (data: SignupRequest | LoginRequest) => {
  const sanitized: any = {
    email: sanitizeString(data.email),
    password: data.password, // Don't sanitize password as it might affect special characters
  };

  if ('fullName' in data) {
    sanitized.fullName = sanitizeString(data.fullName);
  }

  if ('businessName' in data) {
    sanitized.businessName = sanitizeString(data.businessName);
  }

  return sanitized;
};