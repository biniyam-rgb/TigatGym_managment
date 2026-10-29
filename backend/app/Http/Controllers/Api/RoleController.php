<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\RoleResource;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleController extends Controller
{
    /**
     * Display a listing of system roles.
     */
    public function index(Request $request): JsonResponse
    {
        $roles = Role::orderBy('id')->get();

        return response()->json([
            'roles' => RoleResource::collection($roles),
        ], Response::HTTP_OK);
    }
}
