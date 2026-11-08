<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Tigat Gym - Member Card</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 10px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0;" cellspacing="0" cellpadding="0">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0b0f17 0%, #1a2234 100%); padding: 26px 30px; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td style="background: linear-gradient(135deg, #ff7a00 0%, #ea580c 100%); width: 36px; height: 36px; border-radius: 8px; text-align: center; vertical-align: middle;">
                    <span style="font-size: 20px; color: #ffffff; line-height: 36px; display: inline-block;">🏋️</span>
                  </td>
                  <td style="padding-left: 12px; text-align: left;">
                    <div style="font-size: 20px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase; color: #ffffff;">
                      TIGAT <span style="color: #ff7a00;">GYM</span>
                    </div>
                    <div style="font-size: 9px; font-weight: 700; color: #94a3b8; letter-spacing: 0.1em; text-transform: uppercase;">
                      Fitness For Life • Build Your Best Self
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Welcome Message -->
          <tr>
            <td style="padding: 28px 32px 14px 32px;">
              <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0;">
                Welcome, {{ $user->name }}!
              </h1>
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0;">
                Your official 1-year member registration at <strong>Tigat Gym</strong> is complete. Below is your official permanent member card and access QR code.
              </p>
            </td>
          </tr>

          <!-- OFFICIAL PERMANENT CARD (CR80 RATIO EMAIL ADAPTATION) -->
          <tr>
            <td style="padding: 14px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%); border-radius: 16px; border: 2px solid #e2e8f0; box-shadow: 0 8px 24px rgba(0,0,0,0.06); padding: 22px 20px;">
                <tr>
                  <!-- Card Left Column: Details -->
                  <td width="60%" valign="top" style="padding-right: 15px;">
                    <!-- Member Name -->
                    <div style="font-size: 17px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.2;">
                      {{ $user->name }}
                    </div>
                    <div style="font-size: 10px; font-weight: 800; color: #ea580c; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 3px; margin-bottom: 16px;">
                      PREMIUM MEMBER
                    </div>

                    <!-- Membership ID -->
                    <table role="presentation" cellspacing="0" cellpadding="0" style="margin-bottom: 10px;">
                      <tr>
                        <td valign="top" style="font-size: 14px; color: #ea580c; padding-right: 8px;">👤</td>
                        <td>
                          <div style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase;">MEMBERSHIP ID</div>
                          <div style="font-size: 13px; font-weight: 800; font-family: monospace; color: #0f172a;">{{ $profile->member_code }}</div>
                        </td>
                      </tr>
                    </table>

                    <!-- Joining Date -->
                    <table role="presentation" cellspacing="0" cellpadding="0" style="margin-bottom: 10px;">
                      <tr>
                        <td valign="top" style="font-size: 14px; color: #ea580c; padding-right: 8px;">📅</td>
                        <td>
                          <div style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase;">JOINING DATE</div>
                          <div style="font-size: 12px; font-weight: 800; color: #0f172a;">{{ $joiningDateFormatted }}</div>
                        </td>
                      </tr>
                    </table>

                    <!-- Valid Thru -->
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td valign="top" style="font-size: 14px; color: #ea580c; padding-right: 8px;">⏰</td>
                        <td>
                          <div style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase;">VALID THRU (1 YEAR)</div>
                          <div style="font-size: 12px; font-weight: 800; color: #0f172a;">{{ $validThruFormatted }}</div>
                        </td>
                      </tr>
                    </table>
                  </td>

                  <!-- Divider Line -->
                  <td width="2" style="background-color: #ea580c; opacity: 0.35;"></td>

                  <!-- Card Right Column: Logo & QR Code -->
                  <td width="38%" valign="top" align="center" style="padding-left: 15px;">
                    <div style="font-size: 14px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px;">
                      TIGAT <span style="color: #ff7a00;">GYM</span>
                    </div>
                    <div style="font-size: 8px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">
                      — Build Your Best Self —
                    </div>

                    <!-- QR Code -->
                    <div style="display: inline-block; border: 2px solid #ea580c; border-radius: 10px; padding: 4px; background-color: #ffffff;">
                      @if(!empty($qrCodeDataUri))
                        <img src="{{ $qrCodeDataUri }}" alt="Tigat Gym Member QR Code" width="105" height="105" style="display: block; border-radius: 4px;" />
                      @else
                        <div style="width: 105px; height: 105px; background-color: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: #64748b;">
                          {{ $profile->member_code }}
                        </div>
                      @endif
                    </div>

                    <div style="font-size: 9px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 6px;">
                      SCAN TO <span style="color: #ea580c;">CONNECT</span>
                    </div>
                    <div style="font-size: 8px; color: #94a3b8; margin-top: 1px;">
                      Turnstile Access
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Entry Instructions Box -->
          <tr>
            <td style="padding: 16px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 16px;">
                <tr>
                  <td style="font-size: 20px; vertical-align: top; width: 28px; padding-top: 2px;">📲</td>
                  <td style="font-size: 12.5px; line-height: 1.5; color: #334155;">
                    <strong>Turnstile Access:</strong> Simply open this email on your smartphone or save the card image to your gallery. Place the QR code in front of the scanner gun at reception or the turnstile reader to check in automatically.
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
              <div style="font-size: 11px; color: #64748b; margin-bottom: 10px;">
                Fitness & Performance Center • All Rights Reserved
              </div>
              <div style="font-size: 10.5px; color: #94a3b8;">
                If you have questions about your membership, contact us at reception or email 
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
