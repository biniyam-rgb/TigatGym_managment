/**
 * Member validation constants and utility functions for Tigat Gym.
 */

export const BLOOD_TYPES = [
  { value: 'A+' },
  { value: 'A-' },
  { value: 'B+' },
  { value: 'B-' },
  { value: 'AB+' },
  { value: 'AB-' },
  { value: 'O+' },
  { value: 'O-' },
];

export function calculateAge(dobString) {
  if (!dobString) return null;
  const birth = new Date(dobString);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

export function validateSingleField(field, value, allData = {}, isRegister = true) {
  switch (field) {
    case 'name': {
      if (!value || !value.trim()) {
        return 'Full name is required.';
      }
      const trimmed = value.trim();
      if (trimmed.length < 2) {
        return 'Full name must be at least 2 characters.';
      }
      if (trimmed.length > 100) {
        return 'Full name cannot exceed 100 characters.';
      }
      // Allow Latin letters, Ethiopic/Amharic Fidel (\u1200-\u137F), spaces, apostrophes, hyphens, dots
      const nameRegex = /^[a-zA-Z\u1200-\u137F\s'. -]+$/;
      if (!nameRegex.test(trimmed)) {
        return 'Full name should only contain letters and spaces.';
      }
      return null;
    }

    case 'phone': {
      if (!value || !value.trim()) {
        return 'Phone number is required.';
      }
      const cleanPhone = value.trim().replace(/[\s-()]/g, '');
      // Standard Ethiopian (09..., 07..., +251..., 251...) or international 9-15 digits
      const phoneRegex = /^(\+?[0-9]{9,15})$/;
      if (!phoneRegex.test(cleanPhone)) {
        return 'Please enter a valid phone number (e.g. 0911234567 or +251911234567).';
      }
      return null;
    }

    case 'email': {
      if (!value || !value.trim()) {
        return null; // Optional
      }
      const trimmed = value.trim();
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(trimmed)) {
        return 'Please enter a valid email address (e.g. member@email.com).';
      }
      return null;
    }

    case 'date_of_birth': {
      if (!value) return null; // Optional
      const dob = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (isNaN(dob.getTime())) {
        return 'Please enter a valid calendar date.';
      }
      if (dob >= today) {
        return 'Date of birth must be a past date.';
      }
      const minDate = new Date('1920-01-01');
      if (dob < minDate) {
        return 'Please enter a realistic birth year (after 1920).';
      }
      const age = calculateAge(value);
      if (age !== null && age < 12) {
        return `Member is ${age} yrs old. Minimum gym membership age is 12 years.`;
      }
      return null;
    }

    case 'blood_type': {
      if (!value) return null;
      if (!BLOOD_TYPES.some((b) => b.value === value)) {
        return 'Please select a valid blood type from the dropdown list.';
      }
      return null;
    }

    case 'emergency_contact_phone': {
      if (!value || !value.trim()) return null;
      const cleanEmergency = value.trim().replace(/[\s-()]/g, '');
      const phoneRegex = /^(\+?[0-9]{9,15})$/;
      if (!phoneRegex.test(cleanEmergency)) {
        return 'Please enter a valid emergency contact phone (e.g. 0911234567).';
      }
      return null;
    }

    case 'payment_amount': {
      if (isRegister && allData.membership_plan_id) {
        const num = Number(value);
        if (isNaN(num) || num <= 0) {
          return 'Payment amount must be greater than 0 ETB.';
        }
      }
      return null;
    }

    case 'payment_reference': {
      if (isRegister && allData.membership_plan_id && allData.payment_method === 'chapa') {
        if (!value || !value.trim()) {
          return 'Chapa Transaction Reference / Receipt ID (e.g. CHP-123456) is required.';
        }
      }
      return null;
    }

    case 'start_date': {
      if (isRegister && allData.membership_plan_id && value) {
        const start = new Date(value);
        if (isNaN(start.getTime())) {
          return 'Please select a valid start date.';
        }
      }
      return null;
    }

    default:
      return null;
  }
}

export function validateMemberForm(data, isRegister = true) {
  const errors = {};
  const fieldsToValidate = [
    'name',
    'phone',
    'email',
    'date_of_birth',
    'blood_type',
    'emergency_contact_phone',
  ];

  if (isRegister && data.membership_plan_id) {
    fieldsToValidate.push('payment_amount', 'start_date');
    if (data.payment_method === 'chapa') {
      fieldsToValidate.push('payment_reference');
    }
  }

  for (const field of fieldsToValidate) {
    const error = validateSingleField(field, data[field], data, isRegister);
    if (error) {
      errors[field] = error;
    }
  }

  return errors;
}
