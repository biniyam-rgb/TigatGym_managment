<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAccountIsActive
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && ! $user->isActive()) {
            // Revoke current token so inactive/suspended sessions are immediately blocked
            if (method_exists($user, 'currentAccessToken') && $user->currentAccessToken()) {
                $user->currentAccessToken()->delete();
            }

            $message = match ($user->status) {
                'suspended' => 'Your account has been suspended. Please contact gym management.',
                'inactive' => 'Your account is inactive. Please contact gym management.',
                default => 'Your account is not active. Access denied.',
            };

            return response()->json([
                'message' => $message,
                'status' => $user->status,
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
