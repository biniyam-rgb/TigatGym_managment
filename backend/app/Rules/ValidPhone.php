<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class ValidPhone implements ValidationRule
{
    protected bool $allowEmpty;

    public function __construct(bool $allowEmpty = false)
    {
        $this->allowEmpty = $allowEmpty;
    }

    /**
     * Run the validation rule.
     *
     * @param  \Closure(string, ?string=): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if ($this->allowEmpty && (empty($value) || trim($value) === '')) {
            return;
        }

        if (! is_string($value) && ! is_numeric($value)) {
            $fail("The {$attribute} must be a valid phone number.");
            return;
        }

        $phone = trim((string) $value);
        if ($phone === '') {
            if (! $this->allowEmpty) {
                $fail("The {$attribute} field is required.");
            }
            return;
        }

        // Must not contain letters or suspicious special characters
        if (preg_match('/[a-zA-Z<>{}\[\]=]/', $phone)) {
            $fail("The {$attribute} cannot contain alphabetic characters or invalid symbols.");
            return;
        }

        // Clean digits
        $digits = preg_replace('/\D+/', '', $phone);

        // Check if starts with a plus (international notation)
        $hasPlus = str_starts_with($phone, '+');

        // 1. Ethiopian Local format: 09xxxxxxxx or 07xxxxxxxx (exact 10 digits)
        if (str_starts_with($digits, '09') || str_starts_with($digits, '07')) {
            if (strlen($digits) !== 10) {
                $fail("Ethiopian local phone numbers starting with '09' or '07' must be exactly 10 digits (e.g. 0911223344 or 0711223344).");
                return;
            }
            return;
        }

        // 2. Ethiopian International format: +2519xxxxxxxx, +2517xxxxxxxx, 2519xxxxxxxx, 2517xxxxxxxx (12 digits)
        if (str_starts_with($digits, '2519') || str_starts_with($digits, '2517')) {
            if (strlen($digits) !== 12) {
                $fail("Ethiopian international phone numbers (+251...) must be exactly 12 digits (e.g. +251911223344 or +251711223344).");
                return;
            }
            return;
        }

        // 3. Ethiopian Bare format: 9xxxxxxxx or 7xxxxxxxx (9 digits)
        if ((str_starts_with($digits, '9') || str_starts_with($digits, '7')) && strlen($digits) === 9) {
            return;
        }

        // 4. Standard International format (ITU-T E.164): must start with + and be between 8 and 15 digits
        if ($hasPlus && strlen($digits) >= 8 && strlen($digits) <= 15) {
            return;
        }

        // 5. Bare digits international with country code: between 8 and 15 digits
        if (strlen($digits) >= 8 && strlen($digits) <= 15 && ! str_starts_with($digits, '0')) {
            return;
        }

        $fail("The {$attribute} must be a valid phone number (e.g. 0911223344, 0711223344, or +251911223344).");
    }
}
