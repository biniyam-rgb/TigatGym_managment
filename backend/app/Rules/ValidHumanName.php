<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class ValidHumanName implements ValidationRule
{
    protected int $minLength;
    protected int $maxLength;
    protected bool $allowEmpty;

    public function __construct(int $minLength = 2, int $maxLength = 100, bool $allowEmpty = false)
    {
        $this->minLength = $minLength;
        $this->maxLength = $maxLength;
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

        if (! is_string($value)) {
            $fail("The {$attribute} must be a valid text string.");
            return;
        }

        $name = trim($value);

        if ($name === '') {
            if (! $this->allowEmpty) {
                $fail("The {$attribute} field cannot be empty.");
            }
            return;
        }

        $length = mb_strlen($name, 'UTF-8');
        if ($length < $this->minLength) {
            $fail("The {$attribute} must be at least {$this->minLength} characters long.");
            return;
        }

        if ($length > $this->maxLength) {
            $fail("The {$attribute} may not exceed {$this->maxLength} characters.");
            return;
        }

        // Prevent HTML tags, scripts, brackets, and code injection
        if (preg_match('/[<>{}=;$\/\\\\]/', $name)) {
            $fail("The {$attribute} cannot contain HTML tags or programming symbols.");
            return;
        }

        // Must contain at least one valid human letter (Latin, Ethiopic \p{Ethiopic}, or standard Unicode letter \p{L})
        if (! preg_match('/[\p{L}\p{Ethiopic}]/u', $name)) {
            $fail("The {$attribute} must contain at least one alphabetic character.");
            return;
        }

        // Only allow letters, numbers, spaces, hyphens, periods, parentheses, plus signs, and apostrophes
        if (! preg_match('/^[\p{L}\p{Ethiopic}\d\s\-\'\.\(\)\+]+$/u', $name)) {
            $fail("The {$attribute} may only contain letters, numbers, spaces, hyphens, parentheses, and apostrophes.");
            return;
        }
    }
}
