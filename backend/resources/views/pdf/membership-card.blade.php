<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tigat Gym - Membership Card</title>
  <style>
    @page {
      margin: 0;
      size: 85.6mm 53.98mm landscape;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    }
    body {
      background-color: #0b0f17;
      color: #ffffff;
      width: 85.6mm;
      height: 53.98mm;
      position: relative;
      overflow: hidden;
    }
    .card-container {
      width: 100%;
      height: 100%;
      background: #0b0f17;
      border: 1px solid #1f293d;
      padding: 3.5mm 4mm;
      position: relative;
    }
    .accent-bar {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2.2mm;
      background: #ff7a00;
    }
    .header-table {
      width: 100%;
      margin-bottom: 2mm;
    }
    .brand-title {
      font-size: 13pt;
      font-weight: 900;
      letter-spacing: 0.5px;
      color: #ffffff;
      text-transform: uppercase;
      line-height: 1;
    }
    .brand-orange {
      color: #ff7a00;
    }
    .brand-sub {
      font-size: 5.5pt;
      font-weight: 700;
      color: #ff7a00;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      margin-top: 0.8mm;
    }
    .badge-status {
      display: inline-block;
      background: #16a34a;
      color: #ffffff;
      font-size: 5.5pt;
      font-weight: 800;
      padding: 1mm 2.2mm;
      border-radius: 2mm;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .main-table {
      width: 100%;
      margin-top: 1mm;
    }
    .member-name {
      font-size: 10.5pt;
      font-weight: 800;
      color: #ffffff;
      text-transform: uppercase;
      line-height: 1.1;
      letter-spacing: 0.3px;
    }
    .member-plan {
      font-size: 6.5pt;
      font-weight: 800;
      color: #ff7a00;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      margin-bottom: 1.8mm;
      margin-top: 0.5mm;
    }
    .info-label {
      font-size: 4.8pt;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .info-value {
      font-size: 7pt;
      font-weight: 800;
      color: #ffffff;
      font-family: 'Courier New', Courier, monospace;
      margin-bottom: 1.2mm;
    }
    .qr-box {
      background: #ffffff;
      border: 1.2mm solid #ff7a00;
      border-radius: 2mm;
      padding: 1mm;
      display: inline-block;
      text-align: center;
    }
    .scan-text {
      font-size: 4.8pt;
      font-weight: 800;
      color: #ff7a00;
      text-transform: uppercase;
      margin-top: 0.8mm;
      letter-spacing: 0.3px;
    }
    .footer-stamp {
      position: absolute;
      bottom: 2mm;
      left: 4mm;
      right: 4mm;
      font-size: 4.5pt;
      color: #64748b;
      text-align: center;
      border-top: 0.5px solid #1e293b;
      padding-top: 0.8mm;
    }
  </style>
</head>
<body>
  <div class="card-container">
    <div class="accent-bar"></div>

    <!-- Header Lockup -->
    <table class="header-table" cellspacing="0" cellpadding="0">
      <tr>
        <td valign="middle">
          <div class="brand-title">TIGAT <span class="brand-orange">GYM</span></div>
          <div class="brand-sub">Build Your Best Self</div>
        </td>
        <td align="right" valign="middle">
          <span class="badge-status">{{ strtoupper($status ?? 'ACTIVE') }}</span>
        </td>
      </tr>
    </table>

    <!-- Main Content -->
    <table class="main-table" cellspacing="0" cellpadding="0">
      <tr>
        <!-- Left Column: Member details -->
        <td width="64%" valign="top">
          <div class="member-name">{{ $user->name }}</div>
          <div class="member-plan">{{ $planName ?? 'PREMIUM GYM ACCESS' }}</div>

          <table cellspacing="0" cellpadding="0" width="100%">
            <tr>
              <td width="50%" valign="top">
                <div class="info-label">Member ID</div>
                <div class="info-value" style="color: #ff7a00;">{{ $memberCode }}</div>
              </td>
              <td width="50%" valign="top">
                <div class="info-label">Joined / Started</div>
                <div class="info-value">{{ $startDateFormatted }}</div>
              </td>
            </tr>
            <tr>
              <td colspan="2" valign="top">
                <div class="info-label">Expires / Valid Thru</div>
                <div class="info-value" style="color: #38bdf8;">{{ $endDateFormatted }}</div>
              </td>
            </tr>
          </table>
        </td>

        <!-- Right Column: QR Code -->
        <td width="36%" align="right" valign="top">
          <div class="qr-box">
            @if(!empty($qrCodeDataUri))
              <img src="{{ $qrCodeDataUri }}" width="72" height="72" style="display:block;" alt="Turnstile QR" />
            @else
              <div style="width:72px; height:72px; background:#fff; color:#000; font-size:6pt; font-weight:bold; line-height:72px; text-align:center;">
                {{ $memberCode }}
              </div>
            @endif
          </div>
          <div class="scan-text">SCAN FOR ENTRY</div>
        </td>
      </tr>
    </table>

    <div class="footer-stamp">
      Official Turnstile Access Pass • Tigat Gym, Addis Ababa • support@tigatgym.com
    </div>
  </div>
</body>
</html>
