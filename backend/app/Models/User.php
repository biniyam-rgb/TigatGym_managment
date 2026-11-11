<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'phone',
        'status',
        'avatar',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class)->withTimestamps();
    }

    /**
     * Check if user has a specific role.
     */
    public function hasRole(string $roleName): bool
    {
        if ($this->relationLoaded('roles')) {
            return $this->roles->contains('name', $roleName);
        }

        return $this->roles()->where('name', $roleName)->exists();
    }

    /**
     * Check if user has any of the given roles.
     *
     * @param list<string>|string $roles
     */
    public function hasAnyRole(array|string ...$roles): bool
    {
        $flattened = [];
        foreach ($roles as $item) {
            if (is_array($item)) {
                $flattened = array_merge($flattened, $item);
            } else {
                $flattened[] = $item;
            }
        }

        if (empty($flattened)) {
            return false;
        }

        if ($this->relationLoaded('roles')) {
            return $this->roles->pluck('name')->intersect($flattened)->isNotEmpty();
        }

        return $this->roles()->whereIn('name', $flattened)->exists();
    }

    /**
     * Assign a role by name or Role instance.
     */
    public function assignRole(string|Role $role): void
    {
        $roleModel = is_string($role) ? Role::where('name', $role)->firstOrFail() : $role;
        $this->roles()->syncWithoutDetaching([$roleModel->id]);
        $this->unsetRelation('roles');
    }

    /**
     * Remove a role by name or Role instance.
     */
    public function removeRole(string|Role $role): void
    {
        $roleModel = is_string($role) ? Role::where('name', $role)->first() : $role;
        if ($roleModel) {
            $this->roles()->detach($roleModel->id);
            $this->unsetRelation('roles');
        }
    }

    public function isOwner(): bool
    {
        return $this->hasRole('owner');
    }

    public function isAdmin(): bool
    {
        return $this->hasRole('admin');
    }

    public function isReceptionist(): bool
    {
        return $this->hasRole('receptionist');
    }

    public function isTrainer(): bool
    {
        return $this->hasRole('trainer');
    }

    public function isMember(): bool
    {
        return $this->hasRole('member');
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isSuspended(): bool
    {
        return $this->status === 'suspended';
    }

    public function isInactive(): bool
    {
        return $this->status === 'inactive';
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeWithRole($query, string $roleName)
    {
        return $query->whereHas('roles', fn ($q) => $q->where('name', $roleName));
    }

    public function scopeRole($query, string $roleName)
    {
        return $this->scopeWithRole($query, $roleName);
    }

    public function memberProfile(): HasOne
    {
        return $this->hasOne(MemberProfile::class);
    }

    public function trainerProfile(): HasOne
    {
        return $this->hasOne(TrainerProfile::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class, 'member_id');
    }

    public function activeSubscription(): ?Subscription
    {
        $today = now()->toDateString();

        return $this->subscriptions()
            ->with('plan')
            ->where('status', 'active')
            ->where('end_date', '>=', $today)
            ->orderByDesc('end_date')
            ->first();
    }

    public function latestSubscription(): ?Subscription
    {
        return $this->subscriptions()
            ->with('plan')
            ->orderByDesc('id')
            ->first();
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function attendanceRecords(): HasMany
    {
        return $this->hasMany(AttendanceRecord::class, 'member_id');
    }

    /**
     * Scope query to match a phone number flexibly (handling Ethiopian country code +251, leading 0, spaces, and bare digits).
     */
    public function scopeWherePhoneMatches($query, string $search)
    {
        $search = trim($search);
        $digits = preg_replace('/\D+/', '', $search);

        $candidates = [$search, $digits];
        if (str_starts_with($digits, '251') && strlen($digits) > 3) {
            $candidates[] = substr($digits, 3);
        } elseif (str_starts_with($digits, '0') && strlen($digits) > 1) {
            $candidates[] = substr($digits, 1);
        }

        $variants = [];
        foreach ($candidates as $cand) {
            if (!$cand) continue;
            $variants[] = $cand;
            $clean = preg_replace('/\D+/', '', $cand);
            if (strlen($clean) >= 2) {
                $variants[] = $clean;
                $variants[] = '0' . $clean;
                $variants[] = '+251' . $clean;
                $variants[] = '251' . $clean;
            }
        }

        $variants = array_filter(array_unique($variants));

        return $query->where(function ($q) use ($variants, $digits) {
            foreach ($variants as $v) {
                $q->orWhere('phone', 'like', "%{$v}%");
            }
            if ($digits && strlen($digits) >= 3) {
                $q->orWhereRaw("REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '+', ''), '(', '') LIKE ?", ["%{$digits}%"]);
            }
        });
    }
}
