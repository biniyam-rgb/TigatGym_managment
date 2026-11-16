<?php

namespace App\Rules;

use Carbon\Carbon;
use Closure;
use Exception;
use Illuminate\Contracts\Validation\ValidationRule;

class ValidDateOfBirth implements ValidationRule
{
    protected int $minAge;
    protected int $maxAge;
    protected bool $allowEmpty;

    public function __construct(int $minAge = 10, int $maxAge = 110, bool $allowEmpty = true)
    {
        $this->minAge = $minAge;
        $this->maxAge = $maxAge;
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
            $fail("The {$attribute} must be a valid date string.");
            return;
        }

        $dateStr = trim($value);
        if ($dateStr === '') {
            if (! $this->allowEmpty) {
                $fail("The {$attribute} field is required.");
            }
            return;
        }

        try {
            $dob = Carbon::parse($dateStr);
        } catch (Exception) {
            $fail("The {$attribute} is not a recognizable calendar date format (expected YYYY-MM-DD).");
            return;
        }

        $today = Carbon::today();

        if ($dob->gte($today)) {
            $fail("The {$attribute} must be a date in the past.");
            return;
        }

        $age = $dob->diffInYears($today);

        if ($age < $this->minAge) {
            $fail("Members and gym athletes must be at least {$this->minAge} years of age.");
            return;
        }

        if ($age > $this->maxAge) {
            $fail("The {$attribute} indicates an age exceeding {$this->maxAge} years. Please verify the birth year.");
            return;
        }
    }
}
