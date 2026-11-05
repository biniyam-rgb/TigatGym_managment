/**
 * Member validation constants and utility functions for Tigat Gym.
 */

export const BLOOD_TYPES = [
  { value: 'A+'},
  { value: 'A-'},
  { value: 'B+'},
  { value: 'B-'},
  { value: 'AB+'},
  { value: 'AB-'},
  { value: 'O+'},
  { value: 'O-'},
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

export function validateMemberForm(data, isRegister = true) {
  const errors = {};

  // 1. Full Name Validation
  if (!data.name || !data.name.trim()) {
    errors.name = 'Full name is required.';
  } else if (data.name.trim().length < 2) {
    errors.name = 'Full name must be at least 2 characters.';
  }

  // 2. Phone Number Validation
  if (!data.phone || !data.phone.trim()) {
    errors.phone = 'Phone number is required.';
  } else {
    const cleanPhone = data.phone.trim().replace(/[\s-]/g, '');
    const phoneRegex = /^(\+?[0-9]{9,15})$/;
    if (!phoneRegex.test(cleanPhone)) {
      errors.phone = 'Please enter a valid phone number (e.g. 0911234567 or +251911234567).';
    }
  }

  // 3. Email Validation (Optional)
  if (data.email && data.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email.trim())) {
      errors.email = 'Please enter a valid email address (e.g. member@email.com).';
    }
  }

  // 4. Date of Birth Validation
  if (data.date_of_birth) {
    const dob = new Date(data.date_of_birth);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(dob.getTime())) {
      errors.date_of_birth = 'Please enter a valid calendar date.';
    } else if (dob >= today) {
      errors.date_of_birth = 'Date of birth must be a past date.';
    } else {
      const age = calculateAge(data.date_of_birth);
      if (age !== null && age < 12) {
        errors.date_of_birth = `Member is ${age} years old. Minimum gym membership age is 12 years.`;
      } else if (age !== null && age > 110) {
        errors.date_of_birth = 'Please enter a valid birth year.';
      }
    }
  }

  // 5. Blood Type Validation (Optional, must be in BLOOD_TYPES if selected)
  if (data.blood_type && !BLOOD_TYPES.some((b) => b.value === data.blood_type)) {
    errors.blood_type = 'Please select a valid blood type from the list.';
  }

  // 6. Emergency Contact Phone (Optional)
  if (data.emergency_contact_phone && data.emergency_contact_phone.trim()) {
    const cleanEmergency = data.emergency_contact_phone.trim().replace(/[\s-]/g, '');
    const phoneRegex = /^(\+?[0-9]{9,15})$/;
    if (!phoneRegex.test(cleanEmergency)) {
      errors.emergency_contact_phone = 'Please enter a valid emergency contact phone number.';
    }
  }

  // 7. Plan and Payment Validations (Registration only)
  if (isRegister && data.membership_plan_id) {
    if (data.start_date) {
      const startDate = new Date(data.start_date);
      if (isNaN(startDate.getTime())) {
        errors.start_date = 'Please select a valid start date.';
      }
    }

    const amountNum = Number(data.payment_amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      errors.payment_amount = 'Payment amount must be greater than 0 ETB.';
    }

    if (data.payment_method === 'chapa') {
      if (!data.payment_reference || !data.payment_reference.trim()) {
        errors.payment_reference = 'Chapa transaction reference (Tx Ref / Order ID) is required.';
      }
    }
  }

  return errors;
}
