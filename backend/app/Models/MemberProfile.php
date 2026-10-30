<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class MemberProfile extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'member_code',
        'qr_code_token',
        'date_of_birth',
        'gender',
        'blood_type',
        'address',
        'emergency_contact_name',
        'emergency_contact_phone',
        'emergency_contact_relationship',
        'health_conditions',
        'fitness_goals',
        'joined_at',
    ];

    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
            'joined_at' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class, 'member_id', 'user_id');
    }

    public function attendanceRecords(): HasMany
    {
        return $this->hasMany(AttendanceRecord::class, 'member_id', 'user_id');
    }

    /**
     * Generate the next sequential member number: TG-0001, TG-0002...
     */
    public static function generateNextMemberCode(): string
    {
        $existingCodes = self::withTrashed()
            ->where('member_code', 'like', 'TG-%')
            ->pluck('member_code');

        $maxNum = 0;
        foreach ($existingCodes as $code) {
            if (preg_match('/^TG-(\d+)$/', $code, $matches)) {
                $num = (int) $matches[1];
                if ($num > $maxNum) {
                    $maxNum = $num;
                }
            }
        }

        $nextNum = $maxNum + 1;
        $code = sprintf('TG-%04d', $nextNum);

        while (self::withTrashed()->where('member_code', $code)->exists()) {
            $nextNum++;
            $code = sprintf('TG-%04d', $nextNum);
        }

        return $code;
    }

    /**
     * Generate a unique, cryptographically secure QR token.
     */
    public static function generateUniqueQrToken(): string
    {
        do {
            $token = 'TIGAT-' . bin2hex(random_bytes(24));
        } while (self::withTrashed()->where('qr_code_token', $token)->exists());

        return $token;
    }
}
