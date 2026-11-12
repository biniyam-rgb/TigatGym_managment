<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt - Tigat Gym</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 10px;">
    <tr>
      <td align="center">
        <!-- Main Receipt Card -->
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0;" cellspacing="0" cellpadding="0">
          
          <!-- Header Banner (Clean Pure White with Orange Brand Bar) -->
          <tr>
            <td style="background-color: #ffffff; border-bottom: 2px solid #ff7a00; padding: 24px 30px; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td style="background: linear-gradient(135deg, #ff7a00 0%, #ea580c 100%); width: 38px; height: 38px; border-radius: 8px; text-align: center; vertical-align: middle;">
                    <span style="font-size: 20px; color: #ffffff; line-height: 38px; display: inline-block;">🏋️</span>
                  </td>
                  <td style="padding-left: 12px; text-align: left;">
                    <div style="font-size: 22px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; color: #0f172a;">
                      TIGAT <span style="color: #ff7a00;">GYM</span>
                    </div>
                    <div style="font-size: 10px; font-weight: 700; color: #ea580c; letter-spacing: 0.08em; text-transform: uppercase;">
                      Official Payment Receipt
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Receipt Intro -->
          <tr>
            <td style="padding: 26px 32px 14px 32px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <h1 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0;">
                  Payment Confirmation
                </h1>
              </div>
              <p style="font-size: 13.5px; line-height: 1.6; color: #475569; margin: 6px 0 0 0;">
                Dear <strong>{{ $user->name }}</strong>, thank you for your payment. Your transaction has been recorded and verified.
              </p>
            </td>
          </tr>

          <!-- Receipt Details Table -->
          <tr>
            <td style="padding: 10px 32px 20px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                <!-- Header row -->
                <tr style="background-color: #f1f5f9; border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 12px 18px; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Transaction Details</td>
                  <td align="right" style="padding: 12px 18px; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Information</td>
                </tr>

                <!-- Receipt Number -->
                <tr>
                  <td style="padding: 12px 18px; font-size: 13px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Receipt Number</td>
                  <td align="right" style="padding: 12px 18px; font-size: 13.5px; font-weight: 800; font-family: monospace; color: #ff7a00; border-bottom: 1px solid #f1f5f9;">
                    {{ $payment->receipt_number }}
                  </td>
                </tr>

                <!-- Payment Token -->
                <tr>
                  <td style="padding: 12px 18px; font-size: 13px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Payment Ref</td>
                  <td align="right" style="padding: 12px 18px; font-size: 12px; font-weight: 600; font-family: monospace; color: #475569; border-bottom: 1px solid #f1f5f9;">
                    {{ $payment->payment_number }}
                  </td>
                </tr>

                <!-- Member ID -->
                <tr>
                  <td style="padding: 12px 18px; font-size: 13px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Member Code</td>
                  <td align="right" style="padding: 12px 18px; font-size: 13px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #f1f5f9;">
                    {{ $user->memberProfile?->member_code ?: "TG-{$user->id}" }}
                  </td>
                </tr>

                <!-- Description / Plan -->
                <tr>
                  <td style="padding: 12px 18px; font-size: 13px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Item / Package</td>
                  <td align="right" style="padding: 12px 18px; font-size: 13px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #f1f5f9;">
                    {{ $planName }}
                  </td>
                </tr>

                @if(!empty($validityPeriod))
                <!-- Subscription Validity -->
                <tr>
                  <td style="padding: 12px 18px; font-size: 13px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Plan Validity</td>
                  <td align="right" style="padding: 12px 18px; font-size: 12px; font-weight: 700; color: #059669; border-bottom: 1px solid #f1f5f9;">
                    {{ $validityPeriod }}
                  </td>
                </tr>
                @endif

                <!-- Payment Method -->
                <tr>
                  <td style="padding: 12px 18px; font-size: 13px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Payment Method</td>
                  <td align="right" style="padding: 12px 18px; font-size: 13px; font-weight: 600; text-transform: uppercase; color: #475569; border-bottom: 1px solid #f1f5f9;">
                    {{ str_replace('_', ' ', $payment->payment_method) }}
                  </td>
                </tr>

                <!-- Date -->
                <tr>
                  <td style="padding: 12px 18px; font-size: 13px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Date & Time</td>
                  <td align="right" style="padding: 12px 18px; font-size: 12.5px; font-weight: 600; color: #475569; border-bottom: 1px solid #f1f5f9;">
                    {{ $payment->paid_at ? \Carbon\Carbon::parse($payment->paid_at)->format('d M Y, h:i A') : now()->format('d M Y, h:i A') }}
                  </td>
                </tr>

                <!-- Total Amount Paid -->
                <tr style="background-color: #f0fdf4;">
                  <td style="padding: 14px 18px; font-size: 14px; font-weight: 800; color: #166534;">TOTAL PAID</td>
                  <td align="right" style="padding: 14px 18px; font-size: 18px; font-weight: 900; color: #16a34a;">
                    {{ number_format($payment->amount, 2) }} ETB
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Turnstile Access QR Code Stamp -->
          @if(!empty($qrCodeDataUri))
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border: 1.5px solid #fed7aa; border-radius: 12px; padding: 16px;">
                <tr>
                  <td width="90" align="center" valign="middle">
                    <img src="{{ $qrCodeDataUri }}" alt="Turnstile QR" width="80" height="80" style="display: block; border-radius: 6px;" />
                  </td>
                  <td style="padding-left: 16px;" valign="middle">
                    <div style="font-size: 10px; font-weight: 800; color: #ea580c; text-transform: uppercase; letter-spacing: 0.08em;">
                      YOUR TURNSTILE PASS
                    </div>
                    <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin: 3px 0;">
                      Member ID: {{ $user->memberProfile?->member_code ?: "TG-{$user->id}" }}
                    </div>
                    <div style="font-size: 11.5px; color: #64748b;">
                      Present this QR code on your phone when checking in at Tigat Gym.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          @endif

          <!-- Footer Information -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 22px 30px; text-align: center;">
              <div style="font-size: 12px; font-weight: 700; color: #1e293b; margin-bottom: 4px;">
                Tigat Gym • Addis Ababa, Ethiopia
              </div>
              <div style="font-size: 11px; color: #64748b; margin-bottom: 10px;">
                Fitness & Performance Center • Official Payment Receipt
              </div>
              <div style="font-size: 10.5px; color: #94a3b8;">
                Thank you for choosing Tigat Gym! 💪 • 
                <a href="mailto:support@tigatgym.com" style="color: #ea580c; text-decoration: none; font-weight: 600;">support@tigatgym.com</a>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
