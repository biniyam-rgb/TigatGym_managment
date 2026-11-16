<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class ValidMoneyAmount implements ValidationRule
{
    protected float $min;
    protected float $max;
    protected bool $allowZero;

    public function __construct(float $min = 0.01, float $max = 10000000.0, bool $allowZero = false)
    {
        $this->min = $allowZero ? 0.0 : $min;
        $this->max = $max;
        $this->allowZero = $allowZero;
    }

    /**
     * Run the validation rule.
     *
     * @param  \Closure(string, ?string=): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if ($value === null || $value === '') {
            $fail("The {$attribute} field is required.");
            return;
        }

        if (! is_numeric($value)) {
            $fail("The {$attribute} must be a valid numeric monetary amount.");
            return;
        }

        $numericVal = (float) $value;

        if (is_nan($numericVal) || is_infinite($numericVal)) {
            $fail("The {$attribute} must be a finite numerical value.");
            return;
        }

        if (! $this->allowZero && $numericVal <= 0) {
            $fail("The {$attribute} must be greater than zero.");
            return;
        }

        if ($this->allowZero && $numericVal < 0) {
            $fail("The {$attribute} cannot be negative.");
            return;
        }

        if ($numericVal < $this->min) {
            $fail("The {$attribute} must be at least ETB " . number_format($this->min, 2) . ".");
            return;
        }

        if ($numericVal > $this->max) {
            $fail("The {$attribute} cannot exceed ETB " . number_format($this->max, 2) . ".");
            return;
        }

        // Check decimal places (maximum 2 decimal places for currency)
        $stringVal = (string) $value;
        if (str_contains($stringVal, '.')) {
            $parts = explode('.', $stringVal);
            if (isset($parts[1]) && strlen($parts[1]) > 2) {
                $fail("The {$attribute} cannot have more than 2 decimal places (cents).");
                return;
            }
        }
    }
}
