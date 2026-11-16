import React from 'react';

/**
 * Universal Enterprise Validation Engine for Tigat Gym / GymCore
 * Provides client-side validation, sanitizers, and server 422 error mappers across all modules.
 */

// Blood types recognized for medical and athletic safety
export const VALID_BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Work shifts recognized across operations
export const VALID_WORK_SHIFTS = ['morning', 'afternoon', 'evening', 'full_day'];

// Payment methods accepted in Tigat Gym
export const VALID_PAYMENT_METHODS = ['cash', 'bank_transfer', 'bank_slip', 'pos', 'chapa', 'telebirr', 'cbe_birr', 'other'];

/**
 * Validates a human full name (Member, Staff, Coach, Emergency Contact).
 */
export function validateHumanName(value, label = 'Full Name', { required = true, min = 2, max = 100 } = {}) {
  if (!value || !String(value).trim()) {
    return required ? `${label} is required.` : null;
  }

  const trimmed = String(value).trim();

  if (trimmed.length < min) {
    return `${label} must be at least ${min} characters.`;
  }

  if (trimmed.length > max) {
    return `${label} cannot exceed ${max} characters.`;
  }

  // Reject malicious HTML / scripts / brackets
  if (/[<>{}()[\]=$;/\\]/.test(trimmed)) {
    return `${label} contains invalid or forbidden characters.`;
  }

  // Reject pure numbers or names containing digits
  if (/\d/.test(trimmed)) {
    return `${label} cannot contain numeric digits.`;
  }

  // Allow Latin letters, Ethiopic/Amharic script (\u1200-\u137F), spaces, apostrophes, hyphens, and periods
  const namePattern = /^[\p{L}\u1200-\u137F\s'. -]+$/u;
  if (!namePattern.test(trimmed)) {
    return `${label} must contain only letters, spaces, and hyphens.`;
  }

  return null;
}

/**
 * Validates Ethiopian and international phone numbers.
 * Supports: 09xxxxxxxx, 07xxxxxxxx, +2519xxxxxxxx, +2517xxxxxxxx, 2519xxxxxxxx, and international E.164.
 */
export function validatePhoneNumber(value, { required = true, label = 'Phone number' } = {}) {
  if (!value || !String(value).trim()) {
    return required ? `${label} is required.` : null;
  }

  const raw = String(value).trim();

  // Reject alphabetic characters
  if (/[a-zA-Z]/.test(raw)) {
    return `${label} cannot contain letters.`;
  }

  // Extract clean digits
  const digits = raw.replace(/\D+/g, '');
  const hasPlus = raw.startsWith('+');

  // 1. Ethiopian Local Mobile: 09xxxxxxxx or 07xxxxxxxx (10 digits)
  if (digits.startsWith('09') || digits.startsWith('07')) {
    if (digits.length !== 10) {
      return `Ethiopian local phone numbers must be exactly 10 digits (e.g. 0911223344 or 0711223344). Currently ${digits.length} digits.`;
    }
    return null;
  }

  // 2. Ethiopian International Mobile: +2519... or +2517... or 2519... / 2517... (12 digits)
  if (digits.startsWith('2519') || digits.startsWith('2517')) {
    if (digits.length !== 12) {
      return `Ethiopian international numbers (+251...) must be exactly 12 digits (e.g. +251911223344). Currently ${digits.length} digits.`;
    }
    return null;
  }

  // 3. Ethiopian Bare 9 digits (9xxxxxxxx or 7xxxxxxxx)
  if ((digits.startsWith('9') || digits.startsWith('7')) && digits.length === 9) {
    return null;
  }

  // 4. Standard International E.164 (+1, +44, etc.): 8 to 15 digits
  if (hasPlus && digits.length >= 8 && digits.length <= 15) {
    return null;
  }

  // 5. Bare digits international: 8 to 15 digits
  if (digits.length >= 8 && digits.length <= 15 && !digits.startsWith('0')) {
    return null;
  }

  return `Please enter a valid phone number (e.g. 0911223344, 0711223344, or +251911223344).`;
}

/**
 * Validates email format according to RFC 5322.
 */
export function validateEmailAddress(value, { required = false, label = 'Email address' } = {}) {
  if (!value || !String(value).trim()) {
    return required ? `${label} is required.` : null;
  }

  const trimmed = String(value).trim();
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailPattern.test(trimmed)) {
    return `Please enter a valid email address (e.g. name@tigatgym.com).`;
  }

  return null;
}

/**
 * Validates monetary currency amount.
 */
export function validateMoneyAmount(value, { required = true, label = 'Amount', min = 0.01, max = 10000000, allowZero = false } = {}) {
  if (value === null || value === undefined || String(value).trim() === '') {
    return required ? `${label} is required.` : null;
  }

  const num = Number(value);

  if (isNaN(num) || !isFinite(num)) {
    return `${label} must be a valid number.`;
  }

  const effectiveMin = allowZero ? 0 : min;

  if (num < effectiveMin) {
    return `${label} must be at least ${effectiveMin.toLocaleString()} ETB.`;
  }

  if (num > max) {
    return `${label} cannot exceed ${max.toLocaleString()} ETB.`;
  }

  // Check cents decimal precision
  const stringVal = String(value);
  if (stringVal.includes('.')) {
    const decimals = stringVal.split('.')[1];
    if (decimals && decimals.length > 2) {
      return `${label} cannot have more than 2 decimal places (cents).`;
    }
  }

  return null;
}

/**
 * Validates member date of birth and ensures gym athlete age compliance (10 - 110 yrs).
 */
export function validateDateOfBirth(value, { required = false, minAge = 10, maxAge = 110, label = 'Date of birth' } = {}) {
  if (!value || !String(value).trim()) {
    return required ? `${label} is required.` : null;
  }

  const dob = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isNaN(dob.getTime())) {
    return `Please enter a valid calendar date for ${label}.`;
  }

  if (dob >= today) {
    return `${label} must be a date in the past.`;
  }

  // Calculate age accurately
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  if (age < minAge) {
    return `Member is ${age} years old. Minimum athletic safety age for Tigat Gym is ${minAge} years.`;
  }

  if (age > maxAge) {
    return `${label} indicates an age over ${maxAge} years. Please verify the birth year.`;
  }

  return null;
}

/**
 * Validates date chronological order.
 */
export function validateDateRange(startDate, endDate, { startLabel = 'Start date', endLabel = 'End date', allowEqual = true } = {}) {
  if (!startDate || !endDate) return null;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;

  if (allowEqual ? end < start : end <= start) {
    return `${endLabel} must be on or after ${startLabel}.`;
  }

  return null;
}

/**
 * Validates a positive integer quantity/capacity.
 */
export function validateIntegerCount(value, { required = true, label = 'Capacity', min = 1, max = 500 } = {}) {
  if (value === null || value === undefined || String(value).trim() === '') {
    return required ? `${label} is required.` : null;
  }

  const num = Number(value);

  if (!Number.isInteger(num)) {
    return `${label} must be a whole number.`;
  }

  if (num < min) {
    return `${label} must be at least ${min}.`;
  }

  if (num > max) {
    return `${label} cannot exceed ${max}.`;
  }

  return null;
}

/**
 * Validates password length and strength.
 */
export function validatePassword(value, { required = true, isNew = false, minLength = 8, label = 'Password' } = {}) {
  if (!value || !String(value).trim()) {
    return required ? `${label} is required.` : null;
  }

  const trimmed = String(value);

  if (trimmed.length < minLength) {
    return `${label} must be at least ${minLength} characters.`;
  }

  if (isNew) {
    if (!/[A-Za-z]/.test(trimmed) || !/\d/.test(trimmed)) {
      return `${label} must contain at least one letter and one number for account security.`;
    }
  }

  return null;
}

/**
 * Validates required text field with min/max bounds.
 */
export function validateRequiredText(value, label = 'Field', { min = 1, max = 255 } = {}) {
  if (!value || !String(value).trim()) {
    return `${label} is required.`;
  }

  const trimmed = String(value).trim();

  if (trimmed.length < min) {
    return `${label} must be at least ${min} characters.`;
  }

  if (trimmed.length > max) {
    return `${label} cannot exceed ${max} characters.`;
  }

  return null;
}

/**
 * Validates select option value against allowed choices.
 */
export function validateSelectChoice(value, allowedList, label = 'Selection') {
  if (!value) return null;
  if (!allowedList.includes(value)) {
    return `Invalid ${label} chosen. Please select from the available options.`;
  }
  return null;
}

/**
 * Extracts normalized field-level error messages from backend API errors (such as Laravel 422 Unprocessable Content).
 * Returns: { [fieldName]: 'First error message string' }
 */
export function extractApiErrors(error) {
  if (!error) return {};

  const fieldErrors = {};

  // Case 1: ApiError with .errors object: { phone: ['message 1'], email: ['message 2'] }
  if (error.errors && typeof error.errors === 'object') {
    Object.entries(error.errors).forEach(([field, msgs]) => {
      if (Array.isArray(msgs) && msgs.length > 0) {
        fieldErrors[field] = msgs[0];
      } else if (typeof msgs === 'string') {
        fieldErrors[field] = msgs;
      }
    });
    return fieldErrors;
  }

  // Case 2: Response payload has data.errors
  if (error.data?.errors && typeof error.data.errors === 'object') {
    Object.entries(error.data.errors).forEach(([field, msgs]) => {
      if (Array.isArray(msgs) && msgs.length > 0) {
        fieldErrors[field] = msgs[0];
      } else if (typeof msgs === 'string') {
        fieldErrors[field] = msgs;
      }
    });
    return fieldErrors;
  }

  // Case 3: Single general error message
  if (error.message) {
    fieldErrors._general = error.message;
  }

  return fieldErrors;
}

/**
 * Formats an Ethiopian phone number to canonical readable string:
 * e.g. "0911223344" -> "0911 22 33 44"
 * "+251911223344" -> "+251 911 223 344"
 */
export function formatEthiopianPhone(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D+/g, '');

  if (digits.startsWith('09') || digits.startsWith('07')) {
    if (digits.length === 10) {
      return `${digits.slice(0, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
    }
  }

  if (digits.startsWith('251') && digits.length === 12) {
    return `+251 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9, 12)}`;
  }

  return phone;
}

/**
 * Reusable React component that displays an inline validation error message with alert icon.
 */
export function FieldError({ error }) {
  if (!error) return null;
  return React.createElement(
    'span',
    { className: 'field-error-text', role: 'alert' },
    React.createElement(
      'svg',
      { width: 12, height: 12, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.5, strokeLinecap: 'round', strokeLinejoin: 'round' },
      React.createElement('circle', { cx: 12, cy: 12, r: 10 }),
      React.createElement('line', { x1: 12, y1: 8, x2: 12, y2: 12 }),
      React.createElement('line', { x1: 12, y1: 16, x2: 12.01, y2: 16 })
    ),
    React.createElement('span', null, error)
  );
}

