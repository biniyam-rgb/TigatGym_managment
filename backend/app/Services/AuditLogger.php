<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class AuditLogger
{
    /**
     * Keys that should never be captured in audit logs.
     */
    protected const SENSITIVE_KEYS = [
        'password',
        'password_confirmation',
        'current_password',
        'token',
        'remember_token',
        'secret',
    ];

    /**
     * Record an audit event.
     *
     * @param string $action
     * @param Model|null $auditable
     * @param array|null $oldValues
     * @param array|null $newValues
     * @param string|null $notes
     * @param int|null $userId
     * @return AuditLog
     */
    public static function log(
        string $action,
        ?Model $auditable = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?string $notes = null,
        ?int $userId = null
    ): AuditLog {
        $actorId = $userId ?? Auth::id();

        return AuditLog::create([
            'user_id' => $actorId,
            'action' => $action,
            'auditable_type' => $auditable ? get_class($auditable) : null,
            'auditable_id' => $auditable?->getKey(),
            'old_values' => $oldValues ? self::sanitize($oldValues) : null,
            'new_values' => $newValues ? self::sanitize($newValues) : null,
            'ip_address' => Request::ip() ?? '127.0.0.1',
            'user_agent' => Request::userAgent() ? substr(Request::userAgent(), 0, 255) : null,
            'notes' => $notes,
        ]);
    }

    /**
     * Remove sensitive attributes before logging.
     */
    protected static function sanitize(array $data): array
    {
        $sanitized = [];
        foreach ($data as $key => $value) {
            if (in_array(strtolower($key), self::SENSITIVE_KEYS, true)) {
                $sanitized[$key] = '[REDACTED]';
            } elseif (is_array($value)) {
                $sanitized[$key] = self::sanitize($value);
            } else {
                $sanitized[$key] = $value;
            }
        }
        return $sanitized;
    }
}
