<?php

namespace App\Exceptions;

use Exception;

class ChapaException extends Exception
{
    protected ?array $responseBody;
    protected int $statusCode;

    public function __construct(string $message = 'Chapa gateway error', int $statusCode = 502, ?array $responseBody = null, ?Exception $previous = null)
    {
        parent::__construct($message, $statusCode, $previous);
        $this->statusCode = $statusCode;
        $this->responseBody = $responseBody;
    }

    public function getStatusCode(): int
    {
        return $this->statusCode;
    }

    public function getResponseBody(): ?array
    {
        return $this->responseBody;
    }
}
