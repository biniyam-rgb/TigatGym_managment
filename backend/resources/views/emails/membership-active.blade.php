<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your TIGAT GYM Membership Is Active!</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 10px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0;" cellspacing="0" cellpadding="0">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0b0f17 0%, #1a2234 100%); padding: 26px 30px; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td style="background: linear-gradient(135deg, #ff7a00 0%, #ea580c 100%); width: 38px; height: 38px; border-radius: 8px; text-align: center; vertical-align: middle;">
                    <span style="font-size: 20px; color: #ffffff; line-height: 38px; display: inline-block;">🏋️</span>
                  </td>
                  <td style="padding-left: 12px; text-align: left;">
                    <div style="font-size: 22px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase; color: #ffffff;">
                      TIGAT <span style="color: #ff7a00;">GYM</span>
                    </div>
                    <div style="font-size: 9.5pt; font-weight: 700; color: #94a3b8; letter-spacing: 0.1em; text-transform: uppercase;">
                      Fitness For Life • Build Your Best Self
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Welcome & Status Banner -->
          <tr>
            <td style="padding: 28px 32px 16px 32px;">
              <div style="display: inline-block; background-color: #dcfce7; color: #15803d; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
                ✓ Membership Active & Confirmed
              </div>
              <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 10px 0;">
                Welcome, {{ $user->name }}!
              </h1>
              <p style="font-size: 14.5px; line-height: 1.6; color: #475569; margin: 0;">
                Your payment has been successfully verified, and your membership at <strong>Tigat Gym</strong> is now <strong>active</strong>! We are excited to support you on your fitness and wellness journey.
              </p>
            </td>
          </tr>

          <!-- Summary Card -->
          <tr>
            <td style="padding: 10px 32px 20px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 18px 20px;">
                <tr>
                  <td style="padding-bottom: 10px;">
                    <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">MEMBER ID</div>
                    <div style="font-size: 15px; font-weight: 900; color: #ff7a00; font-family: monospace;">{{ $memberCode }}</div>
                  </td>
                  <td style="padding-bottom: 10px;" align="right">
                    <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">PACKAGE / PLAN</div>
                    <div style="font-size: 14px; font-weight: 800; color: #0f172a;">{{ $planName }}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 6px; border-top: 1px solid #e2e8f0;">
                    <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">VALIDITY PERIOD</div>
                    <div style="font-size: 12.5px; font-weight: 800; color: #059669;">{{ $validityPeriod }}</div>
                  </td>
                  <td style="padding-top: 6px; border-top: 1px solid #e2e8f0;" align="right">
                    <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">AMOUNT PAID</div>
                    <div style="font-size: 15px; font-weight: 900; color: #16a34a;">{{ number_format($payment->amount, 2) }} ETB</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Attached Documents Notification Box -->
          <tr>
            <td style="padding: 0 32px 20px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fff7ed; border: 1.5px solid #fed7aa; border-radius: 12px; padding: 16px 20px;">
                <tr>
                  <td width="36" valign="top">
                    <span style="font-size: 26px;">📎</span>
                  </td>
                  <td style="padding-left: 10px;">
                    <div style="font-size: 13px; font-weight: 800; color: #c2410c; margin-bottom: 4px;">
                      Two Official Documents Attached (PDF):
                    </div>
                    <ul style="margin: 0; padding-left: 18px; font-size: 12.5px; color: #7c2d12; line-height: 1.6;">
                      <li><strong>Official Membership Card PDF</strong> (includes your secure turnstile QR code)</li>
                      <li><strong>Payment Tax Receipt PDF</strong> (verified proof of payment)</li>
                    </ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Turnstile Access Instructions -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0b0f17; border-radius: 12px; padding: 18px 22px; color: #ffffff;">
                <tr>
                  <td width="30" valign="top">
                    <span style="font-size: 22px;">📲</span>
                  </td>
                  <td style="padding-left: 12px;">
                    <div style="font-size: 13px; font-weight: 800; color: #ff7a00; text-transform: uppercase; letter-spacing: 0.5px;">
                      How To Access The Gym
                    </div>
                    <div style="font-size: 12px; color: #cbd5e1; line-height: 1.5; margin-top: 4px;">
                      Save the attached Membership Card PDF on your phone or open it from this email. Simply present the QR code to the turnstile reader or reception scanner at the gym door to enter.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer Information -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 22px 30px; text-align: center;">
              <div style="font-size: 12px; font-weight: 700; color: #1e293b; margin-bottom: 4px;">
                Tigat Gym • Addis Ababa, Ethiopia
              </div>
              <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">
                GymCore Automated Membership & Document Delivery System
              </div>
              <div style="font-size: 10.5px; color: #94a3b8;">
                Have questions or need assistance? Reply to this email or reach us at 
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
