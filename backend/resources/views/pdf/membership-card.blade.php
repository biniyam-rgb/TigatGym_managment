<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tigat Gym - Membership Card</title>
  <style>
    @page {
      margin: 0;
      size: 242.64pt 153.0pt landscape;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    }
    body {
      background-color: #ffffff;
      color: #0f172a;
      margin: 0;
      padding: 0;
    }
    .card-page {
      padding: 9pt 11pt 5pt 11pt;
      position: relative;
      background-color: #ffffff;
      page-break-after: always;
    }
    .card-page.last {
      page-break-after: avoid;
    }
    .top-accent {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4pt;
      background: #ff7a00;
    }
    .header-table {
      width: 100%;
      margin-top: 1pt;
      margin-bottom: 3pt;
    }
    .brand-title {
      font-size: 13pt;
      font-weight: 900;
      color: #0f172a;
      text-transform: uppercase;
      line-height: 1;
      letter-spacing: 0.3pt;
    }
    .brand-orange {
      color: #ff7a00;
    }
    .brand-sub {
      font-size: 4.8pt;
      font-weight: 700;
      color: #ea580c;
      text-transform: uppercase;
      letter-spacing: 0.5pt;
      margin-top: 1pt;
    }
    .badge {
      display: inline-block;
      background: #16a34a;
      color: #ffffff;
      font-size: 5.5pt;
      font-weight: 800;
      padding: 2pt 5pt;
      border-radius: 2pt;
      text-transform: uppercase;
      letter-spacing: 0.4pt;
    }
    .member-name {
      font-size: 10.5pt;
      font-weight: 900;
      color: #0f172a;
      text-transform: uppercase;
      line-height: 1.1;
      margin-top: 4pt;
      letter-spacing: 0.2pt;
    }
    .member-plan {
      font-size: 5.8pt;
      font-weight: 800;
      color: #ea580c;
      text-transform: uppercase;
      letter-spacing: 0.4pt;
      margin-top: 1.5pt;
      margin-bottom: 4pt;
    }
    .info-lbl {
      font-size: 4.2pt;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.3pt;
    }
    .info-val {
      font-size: 6.8pt;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 3pt;
    }
    .qr-box {
      border: 1.5pt solid #ff7a00;
      border-radius: 4pt;
      padding: 2pt;
      background: #ffffff;
      display: inline-block;
      text-align: center;
    }
    .scan-lbl {
      font-size: 4.5pt;
      font-weight: 800;
      color: #ea580c;
      text-transform: uppercase;
      margin-top: 1.5pt;
      letter-spacing: 0.4pt;
    }
    .card-footer {
      font-size: 4pt;
      color: #94a3b8;
      text-align: center;
      border-top: 0.5pt solid #f1f5f9;
      padding-top: 3pt;
      margin-top: 7pt;
    }

    /* BACK SIDE STYLING */
    .mag-stripe {
      height: 18pt;
      background: #0f172a;
      margin: -9pt -11pt 6pt -11pt;
    }
    .back-heading {
      font-size: 6.5pt;
      font-weight: 800;
      color: #ea580c;
      text-transform: uppercase;
      letter-spacing: 0.4pt;
    }
    .serial-badge {
      font-size: 5.8pt;
      font-weight: 800;
      color: #ff7a00;
    }
    .rules-table {
      width: 100%;
      font-size: 4.5pt;
      color: #334155;
      line-height: 1.4;
      margin-bottom: 5pt;
    }
    .rules-table td {
      padding-bottom: 2pt;
    }
    .contact-table {
      width: 100%;
      border-top: 0.5pt solid #e2e8f0;
      padding-top: 4pt;
    }
    .contact-txt {
      font-size: 4.6pt;
      color: #64748b;
      line-height: 1.35;
    }
    .sig-line {
      border-bottom: 0.5pt solid #94a3b8;
      height: 9pt;
      width: 60pt;
    }
    .sig-cap {
      font-size: 3.8pt;
      color: #94a3b8;
      text-transform: uppercase;
      margin-top: 1pt;
    }
  </style>
</head>
<body>

  <!-- FRONT SIDE (PAGE 1) -->
  <div class="card-page">
    <div class="top-accent"></div>

    <table width="100%" cellspacing="0" cellpadding="0" class="header-table">
      <tr>
        <td valign="middle">
          <div class="brand-title">TIGAT <span class="brand-orange">GYM</span></div>
          <div class="brand-sub">Build Your Best Self</div>
        </td>
        <td align="right" valign="middle">
          <span class="badge">{{ strtoupper($status ?? 'ACTIVE PASS') }}</span>
        </td>
      </tr>
    </table>

    <table width="100%" cellspacing="0" cellpadding="0" style="margin-top: 2pt;">
      <tr>
        <td width="68%" valign="top">
          <div class="member-name">{{ $user->name }}</div>
          <div class="member-plan">{{ $planName ?? 'PREMIUM MEMBERSHIP' }}</div>

          <table width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td width="50%" valign="top">
                <div class="info-lbl">Member ID</div>
                <div class="info-val" style="color: #ff7a00;">{{ $memberCode }}</div>
              </td>
              <td width="50%" valign="top">
                <div class="info-lbl">Joined / Started</div>
                <div class="info-val">{{ $startDateFormatted }}</div>
              </td>
            </tr>
            <tr>
              <td width="50%" valign="top">
                <div class="info-lbl">Valid Thru</div>
                <div class="info-val" style="color: #0284c7;">{{ $endDateFormatted }}</div>
              </td>
              <td width="50%" valign="top">
                <div class="info-lbl">Contact Phone</div>
                <div class="info-val">{{ $phone ?? ($user->phone ?: 'N/A') }}</div>
              </td>
            </tr>
          </table>
        </td>

        <td width="32%" align="right" valign="top">
          <div class="qr-box">
            @if(!empty($qrCodeDataUri))
              <img src="{{ $qrCodeDataUri }}" width="48" height="48" style="display:block;" alt="Turnstile QR" />
            @else
              <div style="width:48pt; height:48pt; background:#fff; color:#000; font-size:6pt; font-weight:bold; line-height:48pt; text-align:center;">
                {{ $memberCode }}
              </div>
            @endif
          </div>
          <div class="scan-lbl">SCAN FOR ENTRY</div>
        </td>
      </tr>
    </table>

    <div class="card-footer">
      Official Turnstile Access Pass &bull; Tigat Gym, Addis Ababa &bull; support@tigatgym.com
    </div>
  </div>

  <!-- BACK SIDE (PAGE 2) -->
  <div class="card-page last">
    <div class="mag-stripe"></div>

    <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 3pt;">
      <tr>
        <td valign="middle">
          <div class="back-heading">Gym Access Rules &amp; Terms</div>
        </td>
        <td align="right" valign="middle">
          <span class="serial-badge">{{ $memberCode }}-PASS</span>
        </td>
      </tr>
    </table>

    <table class="rules-table" cellspacing="0" cellpadding="0">
      <tr><td width="10" valign="top">1.</td><td>Present this QR pass at the optical turnstile scanner for admission.</td></tr>
      <tr><td valign="top">2.</td><td>Membership is non-transferable and valid for the registered member.</td></tr>
      <tr><td valign="top">3.</td><td>Athletic workout attire and clean gym training shoes required.</td></tr>
      <tr><td valign="top">4.</td><td>Please return dumbbells and re-rack weights to racks after each set.</td></tr>
    </table>

    <table class="contact-table" cellspacing="0" cellpadding="0">
      <tr>
        <td width="66%" valign="top" class="contact-txt">
          <strong style="color: #0f172a;">Front Desk Helpline:</strong> +251 911 234567<br>
          <strong style="color: #0f172a;">Location:</strong> Bole Road, Addis Ababa, Ethiopia<br>
          <strong style="color: #0f172a;">Email:</strong> support@tigatgym.com
        </td>
        <td width="34%" align="right" valign="bottom">
          <div class="sig-line"></div>
          <div class="sig-cap">Authorized Signatory</div>
        </td>
      </tr>
    </table>

    <div class="card-footer">
      Property of Tigat Gym. If found, please return to reception desk.
    </div>
  </div>

</body>
</html>
