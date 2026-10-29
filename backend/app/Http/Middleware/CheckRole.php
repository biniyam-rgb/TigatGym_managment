<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        // Roles can be passed as comma-separated in single argument or multiple arguments
        $allowedRoles = [];
        foreach ($roles as $role) {
            foreach (explode(',', $role) as $r) {
                $trimmed = trim($r);
                if ($trimmed !== '') {
                    $allowedRoles[] = $trimmed;
                }
            }
        }

        if (empty($allowedRoles)) {
            return $next($request);
        }

        if (! $user->hasAnyRole($allowedRoles)) {
            return response()->json([
                'message' => 'Forbidden. You do not possess the required role permissions.',
                'required_roles' => $allowedRoles,
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
