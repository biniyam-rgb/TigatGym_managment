<?php

namespace Tests\Unit;

use App\Exceptions\ChapaException;
use App\Services\ChapaService;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use InvalidArgumentException;
use Tests\TestCase;

class ChapaServiceTest extends TestCase
{
    protected ChapaService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = new ChapaService(
            secretKey: 'CHASECK_TEST-mock-key-12345',
            baseUrl: 'https://api.chapa.global',
            webhookSecret: 'mock-webhook-secret-xyz',
            timeout: 5
        );
    }

    public function test_minor_units_conversion(): void
    {
        $this->assertSame(150000, ChapaService::convertToMinorUnits(1500));
        $this->assertSame(150000, ChapaService::convertToMinorUnits('1500.00'));
        $this->assertSame(2550, ChapaService::convertToMinorUnits(25.50));
        $this->assertSame(100, ChapaService::convertToMinorUnits(1));

        $this->assertSame(1500.00, ChapaService::convertFromMinorUnits(150000));
        $this->assertSame(25.50, ChapaService::convertFromMinorUnits(2550));
        $this->assertSame(1.00, ChapaService::convertFromMinorUnits(100));

        $this->expectException(InvalidArgumentException::class);
        ChapaService::convertToMinorUnits(-50);
    }

    public function test_initialize_hosted_payment_success(): void
    {
        Http::fake([
            'https://api.chapa.global/v2/payments/hosted' => Http::response([
                'status' => 'success',
                'message' => 'Hosted payment initialized',
                'data' => [
                    'checkout_url' => 'https://checkout.chapa.global/checkout/payment/mock-token',
                ],
            ], 200),
        ]);

        $payload = [
            'amount' => 1500, // 1,500 ETB
            'currency' => 'ETB',
            'merchant_reference' => 'TG-P-987654',
            'customer' => [
                'first_name' => 'Abebe',
                'last_name' => 'Bikila',
                'email' => 'abebe@example.com',
                'phone_number' => '+251911223344',
            ],
            'callback_url' => 'https://tigatgym.com/api/payments/chapa/webhook',
            'return_url' => 'https://tigatgym.com/payments/verify',
        ];

        $result = $this->service->initializeHostedPayment($payload, 'idemp-key-123');

        $this->assertTrue($result['success']);
        $this->assertSame('https://checkout.chapa.global/checkout/payment/mock-token', $result['checkout_url']);
        $this->assertSame('TG-P-987654', $result['merchant_reference']);
        $this->assertSame('mock-token', $result['gateway_reference']);
        $this->assertSame('idemp-key-123', $result['idempotency_key']);
        $this->assertSame(150000, $result['amount_in_cents']);
        $this->assertSame(1500.00, $result['amount']);
        $this->assertSame('ETB', $result['currency']);

        Http::assertSent(function ($request) {
            return $request->url() === 'https://api.chapa.global/v2/payments/hosted'
                && $request->hasHeader('Authorization', 'Bearer CHASECK_TEST-mock-key-12345')
                && $request->hasHeader('Idempotency-Key', 'idemp-key-123')
                && $request['amount'] === 150000
                && $request['merchant_reference'] === 'TG-P-987654';
        });
    }

    public function test_initialize_hosted_payment_requires_idempotency_key(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Idempotency-Key is mandatory for Chapa payment initialization and cannot be empty.');

        $this->service->initializeHostedPayment([
            'amount' => 100,
            'merchant_reference' => 'TG-NO-IDEMP',
            'callback_url' => 'https://example.com/callback',
            'return_url' => 'https://example.com/return',
        ], '');
    }

    public function test_initialize_hosted_payment_api_error(): void
    {
        Http::fake([
            'https://api.chapa.global/v2/payments/hosted' => Http::response([
                'status' => 'error',
                'message' => 'Invalid currency or currency not supported.',
            ], 400),
        ]);

        $this->expectException(ChapaException::class);
        $this->expectExceptionMessage('Invalid currency or currency not supported.');

        $this->service->initializeHostedPayment([
            'amount' => 100,
            'currency' => 'XYZ',
            'merchant_reference' => 'TG-ERR-1',
            'customer' => ['first_name' => 'Test'],
            'callback_url' => 'https://example.com/callback',
            'return_url' => 'https://example.com/return',
        ], 'idemp-err-1');
    }

    public function test_initialize_hosted_payment_reference_max_length(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage("Chapa merchant_reference cannot exceed 20 characters");

        $this->service->initializeHostedPayment([
            'amount' => 500,
            'merchant_reference' => 'TG-REF-TOO-LONG-CHARACTERS-EXCEEDING-20',
            'callback_url' => 'https://example.com/callback',
            'return_url' => 'https://example.com/return',
        ], 'idemp-toolong');
    }

    public function test_initialize_hosted_payment_network_timeout(): void
    {
        Http::fake([
            'https://api.chapa.global/v2/payments/hosted' => function () {
                throw new ConnectionException('Connection timed out after 5000 milliseconds');
            },
        ]);

        $this->expectException(ChapaException::class);
        $this->expectExceptionCode(504);

        $this->service->initializeHostedPayment([
            'amount' => 1500,
            'merchant_reference' => 'TG-TIMEOUT-1',
            'callback_url' => 'https://example.com/callback',
            'return_url' => 'https://example.com/return',
        ], 'idemp-timeout');
    }

    public function test_verify_payment_success(): void
    {
        Http::fake([
            'https://api.chapa.global/v2/payments/TG-VERIFY-1/verify' => Http::response([
                'status' => 'success',
                'message' => 'Payment verified successfully',
                'data' => [
                    'status' => 'success',
                    'amount' => 150000,
                    'currency' => 'ETB',
                    'merchant_reference' => 'TG-VERIFY-1',
                    'payment_method' => 'telebirr',
                ],
            ], 200),
        ]);

        $result = $this->service->verifyPayment('TG-VERIFY-1');

        $this->assertTrue($result['success']);
        $this->assertTrue($result['is_paid']);
        $this->assertSame('success', $result['status']);
        $this->assertSame(150000, $result['amount_in_cents']);
        $this->assertSame(1500.00, $result['amount']);
        $this->assertSame('ETB', $result['currency']);
        $this->assertSame('TG-VERIFY-1', $result['merchant_reference']);
    }

    public function test_verify_payment_with_exact_chapa_v2_payload_mapping(): void
    {
        $chapaRef = 'CHAPA-V2-REF-998877';
        $merchantRef = 'TG-261107-123456';

        Http::fake([
            "https://api.chapa.global/v2/payments/{$chapaRef}/verify" => Http::response([
                'status' => 'success',
                'message' => 'Payment details retrieved successfully',
                'data' => [
                    'chapa_reference' => $chapaRef,
                    'merchant_reference' => $merchantRef,
                    'amount' => 150000, // integer cents from data.amount
                    'currency' => 'ETB',
                    'status' => 'SUCCESS', // uppercase SUCCESS
                    'payment_method' => 'telebirr',
                ],
            ], 200),
        ]);

        $result = $this->service->verifyPayment($chapaRef);

        $this->assertTrue($result['success']);
        $this->assertTrue($result['is_paid']);
        $this->assertSame('success', $result['status']);
        $this->assertSame('SUCCESS', $result['raw_status']);
        $this->assertSame($chapaRef, $result['chapa_reference']);
        $this->assertSame($chapaRef, $result['gateway_reference']);
        $this->assertSame($merchantRef, $result['merchant_reference']);
        $this->assertSame(150000, $result['amount_in_cents']);
        $this->assertSame(1500.00, $result['amount']);
        $this->assertSame('ETB', $result['currency']);
        $this->assertSame('telebirr', $result['payment_method']);
    }

    public function test_is_valid_minor_units_amount_helper(): void
    {
        // Valid integers
        $this->assertTrue(ChapaService::isValidMinorUnitsAmount(150000));
        $this->assertTrue(ChapaService::isValidMinorUnitsAmount(0));

        // Valid numeric strings (preserved without multiplication)
        $this->assertTrue(ChapaService::isValidMinorUnitsAmount('150000'));
        $this->assertTrue(ChapaService::isValidMinorUnitsAmount('0'));
        $this->assertTrue(ChapaService::isValidMinorUnitsAmount('  250000  '));

        // Invalid: negative
        $this->assertFalse(ChapaService::isValidMinorUnitsAmount(-150000));
        $this->assertFalse(ChapaService::isValidMinorUnitsAmount('-150000'));

        // Invalid: decimals
        $this->assertFalse(ChapaService::isValidMinorUnitsAmount(1500.50));
        $this->assertFalse(ChapaService::isValidMinorUnitsAmount('1500.50'));
        $this->assertFalse(ChapaService::isValidMinorUnitsAmount('150000.00'));

        // Invalid: null, empty, non-numeric
        $this->assertFalse(ChapaService::isValidMinorUnitsAmount(null));
        $this->assertFalse(ChapaService::isValidMinorUnitsAmount(''));
        $this->assertFalse(ChapaService::isValidMinorUnitsAmount('abc'));
        $this->assertFalse(ChapaService::isValidMinorUnitsAmount([]));
    }

    public function test_verify_payment_accepts_numeric_string_amount_without_multiplying(): void
    {
        $chapaRef = 'CHAPA-STR-123';
        $merchantRef = 'TG-STR-123';

        // Gateway returns numeric string "150000"
        Http::fake([
            "https://api.chapa.global/v2/payments/{$chapaRef}/verify" => Http::response([
                'status' => 'success',
                'data' => [
                    'chapa_reference' => $chapaRef,
                    'merchant_reference' => $merchantRef,
                    'amount' => '150000', // string format
                    'currency' => 'ETB',
                    'status' => 'SUCCESS',
                ],
            ], 200),
        ]);

        $result = $this->service->verifyPayment($chapaRef);

        $this->assertTrue($result['success']);
        // Crucial: exact value 150000 preserved, NOT multiplied by 100 to 15000000
        $this->assertSame(150000, $result['amount_in_cents']);
        $this->assertSame(1500.00, $result['amount']);
        $this->assertSame($merchantRef, $result['merchant_reference']);
    }

    public function test_verify_payment_rejects_missing_amount(): void
    {
        $chapaRef = 'CHAPA-NO-AMT';

        Http::fake([
            "https://api.chapa.global/v2/payments/{$chapaRef}/verify" => Http::response([
                'status' => 'success',
                'data' => [
                    'chapa_reference' => $chapaRef,
                    'merchant_reference' => 'TG-REF-1',
                    'currency' => 'ETB',
                    'status' => 'SUCCESS',
                ],
            ], 200),
        ]);

        $this->expectException(ChapaException::class);
        $this->expectExceptionMessage('Chapa verification response contains an invalid or missing amount.');
        $this->expectExceptionCode(422);

        $this->service->verifyPayment($chapaRef);
    }

    public function test_verify_payment_rejects_negative_or_decimal_amount(): void
    {
        $chapaRef = 'CHAPA-DEC-AMT';

        Http::fake([
            "https://api.chapa.global/v2/payments/{$chapaRef}/verify" => Http::response([
                'status' => 'success',
                'data' => [
                    'chapa_reference' => $chapaRef,
                    'merchant_reference' => 'TG-REF-1',
                    'amount' => '1500.50', // decimal string
                    'currency' => 'ETB',
                    'status' => 'SUCCESS',
                ],
            ], 200),
        ]);

        $this->expectException(ChapaException::class);
        $this->expectExceptionMessage('Chapa verification response contains an invalid or missing amount.');
        $this->expectExceptionCode(422);

        $this->service->verifyPayment($chapaRef);
    }

    public function test_verify_payment_does_not_fallback_to_tx_ref_when_merchant_reference_missing(): void
    {
        $chapaRef = 'CHAPA-NO-MERCH-REF';

        Http::fake([
            "https://api.chapa.global/v2/payments/{$chapaRef}/verify" => Http::response([
                'status' => 'success',
                'data' => [
                    'chapa_reference' => $chapaRef,
                    'tx_ref' => 'LEGACY-TX-REF-DO-NOT-USE',
                    'amount' => 150000,
                    'currency' => 'ETB',
                    'status' => 'SUCCESS',
                ],
            ], 200),
        ]);

        $result = $this->service->verifyPayment($chapaRef);

        // Merchant reference must be empty string, never falling back to tx_ref
        $this->assertSame('', $result['merchant_reference']);
    }

    public function test_verify_payment_not_found(): void
    {
        Http::fake([
            'https://api.chapa.global/v2/payments/TG-NOTFOUND/verify' => Http::response([
                'status' => 'error',
                'message' => 'Transaction not found',
            ], 404),
        ]);

        $result = $this->service->verifyPayment('TG-NOTFOUND');

        $this->assertFalse($result['success']);
        $this->assertFalse($result['is_paid']);
        $this->assertSame('not_found', $result['status']);
    }

    public function test_verify_payment_failed_status(): void
    {
        Http::fake([
            'https://api.chapa.global/v2/payments/TG-FAILED-1/verify' => Http::response([
                'status' => 'success',
                'data' => [
                    'status' => 'failed',
                    'amount' => 150000,
                    'currency' => 'ETB',
                    'merchant_reference' => 'TG-FAILED-1',
                ],
            ], 200),
        ]);

        $result = $this->service->verifyPayment('TG-FAILED-1');

        $this->assertTrue($result['success']);
        $this->assertFalse($result['is_paid']);
        $this->assertSame('failed', $result['status']);
    }

    public function test_verify_webhook_signature(): void
    {
        $payload = json_encode(['event' => 'charge.complete', 'reference' => 'TG-WH-1']);
        $validSignature = hash_hmac('sha256', $payload, 'mock-webhook-secret-xyz');

        // Valid signature matches
        $this->assertTrue($this->service->verifyWebhookSignature($payload, $validSignature));

        // Invalid signature rejected
        $this->assertFalse($this->service->verifyWebhookSignature($payload, 'invalid-signature-hash'));

        // Tampered payload rejected
        $tamperedPayload = json_encode(['event' => 'charge.complete', 'reference' => 'TG-WH-TAMPERED']);
        $this->assertFalse($this->service->verifyWebhookSignature($tamperedPayload, $validSignature));

        // Missing signature rejected
        $this->assertFalse($this->service->verifyWebhookSignature($payload, null));
        $this->assertFalse($this->service->verifyWebhookSignature($payload, ''));
    }
}
