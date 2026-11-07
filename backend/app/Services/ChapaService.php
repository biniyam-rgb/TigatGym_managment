<?php

namespace App\Services;

use App\Exceptions\ChapaException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class ChapaService
{
    protected ?string $secretKey;
    protected string $baseUrl;
    protected ?string $webhookSecret;
    protected int $timeout;

    /**
     * Initialize ChapaService with configurations.
     */
    public function __construct(
        ?string $secretKey = null,
        ?string $baseUrl = null,
        ?string $webhookSecret = null,
        ?int $timeout = null
    ) {
        $this->secretKey = $secretKey ?? config('services.chapa.secret_key');
        $this->baseUrl = rtrim($baseUrl ?? config('services.chapa.base_url', 'https://api.chapa.global'), '/');
        $this->webhookSecret = $webhookSecret ?? config('services.chapa.webhook_secret');
        $this->timeout = $timeout ?? (int) config('services.chapa.timeout', 15);
    }

    /**
     * Check whether Chapa API credentials are configured.
     */
    public function isConfigured(): bool
    {
        return ! empty($this->secretKey) && ! str_starts_with($this->secretKey, 'CHASECK_TEST-placeholder');
    }

    /**
     * Get the active base URL.
     */
    public function getBaseUrl(): string
    {
        return $this->baseUrl;
    }

    /**
     * Convert standard currency amount (e.g. 1500.00 ETB) to integer minor units / cents (e.g. 150000).
     */
    public static function convertToMinorUnits(float|int|string $amount): int
    {
        $floatVal = (float) $amount;
        if ($floatVal < 0) {
            throw new \InvalidArgumentException('Payment amount cannot be negative.');
        }

        return (int) round($floatVal * 100);
    }

    /**
     * Convert minor units / cents (e.g. 150000) to standard decimal currency amount (e.g. 1500.00).
     */
    public static function convertFromMinorUnits(int|float $amountInMinorUnits): float
    {
        return round(((float) $amountInMinorUnits) / 100, 2);
    }

    /**
     * Initialize a Hosted Checkout session using Chapa API v2.
     *
     * Endpoint: POST /v2/payments/hosted
     *
     * @param  array  $payload  [amount, currency, merchant_reference, customer, return_url, callback_url]
     * @param  string  $idempotencyKey  Mandatory unique idempotency key for safe retries
     * @return array Standardized result with checkout_url, merchant_reference, gateway_reference, amount_in_minor_units
     *
     * @throws ChapaException
     */
    public function initializeHostedPayment(array $payload, string $idempotencyKey): array
    {
        if (! $this->isConfigured()) {
            throw new ChapaException('Chapa payment gateway is not properly configured. Secret key missing.', 500);
        }

        $cleanIdempotencyKey = trim($idempotencyKey);
        if (empty($cleanIdempotencyKey)) {
            throw new \InvalidArgumentException('Idempotency-Key is mandatory for Chapa payment initialization and cannot be empty.');
        }

        // Validate required fields
        $this->validateInitializationPayload($payload);

        // Ensure amount is in integer minor units (cents) for Chapa v2
        if (isset($payload['amount_in_cents'])) {
            $amountInMinorUnits = (int) $payload['amount_in_cents'];
        } else {
            $amountInMinorUnits = self::convertToMinorUnits($payload['amount']);
        }

        $merchantRef = (string) $payload['merchant_reference'];
        $currency = strtoupper($payload['currency'] ?? 'ETB');

        // Customer details
        $customer = $payload['customer'] ?? [];
        $sanitizedCustomer = [
            'first_name' => trim((string) ($customer['first_name'] ?? 'GymCore')),
            'last_name' => trim((string) ($customer['last_name'] ?? 'Member')),
            'email' => trim((string) ($customer['email'] ?? 'reception@tigatgym.com')),
            'phone_number' => trim((string) ($customer['phone_number'] ?? '')),
        ];

        $requestBody = [
            'amount' => $amountInMinorUnits,
            'currency' => $currency,
            'merchant_reference' => $merchantRef,
            'customer' => $sanitizedCustomer,
            'callback_url' => $payload['callback_url'],
            'return_url' => $payload['return_url'],
        ];

        if (! empty($payload['customization'])) {
            $requestBody['customization'] = $payload['customization'];
        }

        $endpoint = "{$this->baseUrl}/v2/payments/hosted";

        Log::info('Chapa v2 hosted payment initialization starting', [
            'merchant_reference' => $merchantRef,
            'amount_in_minor_units' => $amountInMinorUnits,
            'currency' => $currency,
            'endpoint' => $endpoint,
        ]);

        try {
            $httpClient = Http::withToken($this->secretKey)
                ->acceptJson()
                ->timeout($this->timeout)
                ->withHeaders(['Idempotency-Key' => $cleanIdempotencyKey]);

            $response = $httpClient->post($endpoint, $requestBody);

            $responseBody = $response->json() ?? [];

            if ($response->successful()) {
                $checkoutUrl = $responseBody['data']['checkout_url']
                    ?? $responseBody['checkout_url']
                    ?? null;

                if (empty($checkoutUrl)) {
                    Log::error('Chapa v2 hosted checkout response missing checkout_url', [
                        'response' => $responseBody,
                        'merchant_reference' => $merchantRef,
                    ]);
                    throw new ChapaException('Chapa response did not return a valid checkout URL.', 502, $responseBody);
                }

                // Extract Chapa's specific payment reference (separate from GymCore's merchant_reference)
                $chapaReference = $responseBody['data']['payment_reference']
                    ?? $responseBody['data']['reference']
                    ?? $responseBody['data']['tx_ref']
                    ?? null;

                if (empty($chapaReference) && ! empty($checkoutUrl)) {
                    $pathParts = explode('/', trim(parse_url($checkoutUrl, PHP_URL_PATH) ?? '', '/'));
                    $chapaReference = end($pathParts) ?: null;
                }

                Log::info('Chapa v2 hosted payment initialized successfully', [
                    'merchant_reference' => $merchantRef,
                    'gateway_reference' => $chapaReference,
                    'checkout_url' => $checkoutUrl,
                ]);

                return [
                    'success' => true,
                    'checkout_url' => $checkoutUrl,
                    'merchant_reference' => $merchantRef,
                    'gateway_reference' => $chapaReference,
                    'idempotency_key' => $cleanIdempotencyKey,
                    'amount_in_cents' => $amountInMinorUnits,
                    'amount' => self::convertFromMinorUnits($amountInMinorUnits),
                    'currency' => $currency,
                    'data' => $responseBody,
                ];
            }

            // HTTP error response from Chapa
            $errorMessage = $responseBody['message']
                ?? $responseBody['error']
                ?? "Chapa initialization failed with HTTP status {$response->status()}";

            Log::error('Chapa v2 hosted payment initialization failed', [
                'status' => $response->status(),
                'merchant_reference' => $merchantRef,
                'response' => $responseBody,
            ]);

            throw new ChapaException($errorMessage, $response->status(), $responseBody);
        } catch (ConnectionException $e) {
            Log::error('Chapa v2 connection timeout or network failure', [
                'merchant_reference' => $merchantRef,
                'message' => $e->getMessage(),
            ]);
            throw new ChapaException('Unable to connect to Chapa payment gateway. Connection timed out.', 504, null, $e);
        } catch (ChapaException $e) {
            throw $e;
        } catch (Throwable $e) {
            Log::error('Chapa v2 unexpected initialization exception', [
                'merchant_reference' => $merchantRef,
                'message' => $e->getMessage(),
            ]);
            throw new ChapaException('An unexpected error occurred while communicating with Chapa: ' . $e->getMessage(), 500, null, $e);
        }
    }

    /**
     * Verify a payment transaction using Chapa API v2.
     *
     * Endpoint: GET /v2/payments/{paymentReference}/verify
     *
     * @param  string  $paymentReference  Chapa merchant reference or transaction reference
     * @return array Standardized verification outcome
     *
     * @throws ChapaException
     */
    public function verifyPayment(string $paymentReference): array
    {
        if (! $this->isConfigured()) {
            throw new ChapaException('Chapa payment gateway is not properly configured. Secret key missing.', 500);
        }

        $cleanRef = trim($paymentReference);
        if (empty($cleanRef)) {
            throw new \InvalidArgumentException('Payment reference is required for verification.');
        }

        $endpoint = "{$this->baseUrl}/v2/payments/{$cleanRef}/verify";

        Log::info('Chapa v2 verifying payment', [
            'reference' => $cleanRef,
            'endpoint' => $endpoint,
        ]);

        try {
            $response = Http::withToken($this->secretKey)
                ->acceptJson()
                ->timeout($this->timeout)
                ->get($endpoint);

            $responseBody = $response->json() ?? [];

            if ($response->status() === 404) {
                Log::warning('Chapa v2 payment reference not found', [
                    'reference' => $cleanRef,
                    'response' => $responseBody,
                ]);

                return [
                    'success' => false,
                    'is_paid' => false,
                    'status' => 'not_found',
                    'message' => 'Payment reference was not found on Chapa gateway.',
                    'reference' => $cleanRef,
                    'raw' => $responseBody,
                ];
            }

            if (! $response->successful()) {
                $errorMessage = $responseBody['message']
                    ?? $responseBody['error']
                    ?? "Chapa verification failed with HTTP status {$response->status()}";

                Log::error('Chapa v2 payment verification returned HTTP error', [
                    'reference' => $cleanRef,
                    'status' => $response->status(),
                    'response' => $responseBody,
                ]);

                throw new ChapaException($errorMessage, $response->status(), $responseBody);
            }

            // Successfully received verification response
            $data = $responseBody['data'] ?? $responseBody;
            $rawStatus = strtolower((string) ($data['status'] ?? $responseBody['status'] ?? ''));

            $normalizedStatus = match ($rawStatus) {
                'success', 'successful', 'paid', 'completed' => 'success',
                'failed', 'failure' => 'failed',
                'cancelled', 'canceled' => 'cancelled',
                default => 'pending',
            };

            // Raw amount can be integer minor units or float/string
            $rawAmount = $data['amount'] ?? 0;
            // If raw amount is returned as minor units (e.g. 10000 cents for 100 ETB) or standard units
            // Chapa v2 documents amount in minor units (integer cents).
            $amountInCents = is_int($rawAmount) ? $rawAmount : (int) round(((float) $rawAmount) * 100);
            $amountInMajor = is_int($rawAmount) && $rawAmount >= 100
                ? self::convertFromMinorUnits($rawAmount)
                : (float) $rawAmount;

            $currency = strtoupper((string) ($data['currency'] ?? 'ETB'));
            $merchantRef = (string) ($data['merchant_reference'] ?? $data['tx_ref'] ?? $cleanRef);

            Log::info('Chapa v2 payment verification completed', [
                'reference' => $cleanRef,
                'normalized_status' => $normalizedStatus,
                'amount_in_cents' => $amountInCents,
                'currency' => $currency,
            ]);

            return [
                'success' => true,
                'is_paid' => $normalizedStatus === 'success',
                'status' => $normalizedStatus,
                'reference' => $cleanRef,
                'merchant_reference' => $merchantRef,
                'amount_in_cents' => $amountInCents,
                'amount' => $amountInMajor,
                'currency' => $currency,
                'payment_method' => $data['payment_method'] ?? 'chapa',
                'raw' => $responseBody,
            ];
        } catch (ConnectionException $e) {
            Log::error('Chapa v2 verification connection timeout', [
                'reference' => $cleanRef,
                'message' => $e->getMessage(),
            ]);
            throw new ChapaException('Chapa verification request timed out.', 504, null, $e);
        } catch (ChapaException $e) {
            throw $e;
        } catch (Throwable $e) {
            Log::error('Chapa v2 verification unexpected exception', [
                'reference' => $cleanRef,
                'message' => $e->getMessage(),
            ]);
            throw new ChapaException('Unexpected error verifying payment with Chapa: ' . $e->getMessage(), 500, null, $e);
        }
    }

    /**
     * Verify the HMAC-SHA256 signature of an incoming webhook payload.
     *
     * @param  string  $rawBody  The raw HTTP request body string
     * @param  string|null  $providedSignature  The signature header from Chapa (x-chapa-signature)
     * @return bool True if valid, false otherwise
     */
    public function verifyWebhookSignature(string $rawBody, ?string $providedSignature): bool
    {
        if (empty($providedSignature)) {
            Log::warning('Chapa webhook signature verification failed: header missing');
            return false;
        }

        if (empty($this->webhookSecret)) {
            Log::warning('Chapa webhook signature verification failed: CHAPA_WEBHOOK_SECRET is not configured');
            return false;
        }

        $expectedSignature = hash_hmac('sha256', $rawBody, $this->webhookSecret);

        $matches = hash_equals($expectedSignature, $providedSignature);

        if (! $matches) {
            Log::warning('Chapa webhook signature mismatch', [
                'provided' => substr($providedSignature, 0, 8) . '...',
            ]);
        }

        return $matches;
    }

    /**
     * Validate the required keys for hosted payment initialization.
     */
    protected function validateInitializationPayload(array $payload): void
    {
        $requiredKeys = ['amount', 'merchant_reference', 'callback_url', 'return_url'];
        foreach ($requiredKeys as $key) {
            if (! isset($payload[$key]) || (is_string($payload[$key]) && trim($payload[$key]) === '')) {
                throw new \InvalidArgumentException("Missing required parameter for Chapa hosted payment: {$key}");
            }
        }

        $ref = (string) $payload['merchant_reference'];
        if (strlen($ref) > 20) {
            throw new \InvalidArgumentException("Chapa merchant_reference cannot exceed 20 characters (got: '{$ref}').");
        }
    }
}
