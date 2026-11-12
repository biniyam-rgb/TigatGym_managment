<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tigat Gym - Official Payment Receipt</title>
  <style>
    @page {
      margin: 14mm 16mm;
      size: A4 portrait;
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
      font-size: 9.5pt;
      line-height: 1.45;
    }
    .header-table {
      width: 100%;
      border-bottom: 2px solid #ff7a00;
      padding-bottom: 6mm;
      margin-bottom: 7mm;
    }
    .brand-title {
      font-size: 22pt;
      font-weight: 900;
      letter-spacing: 0.5px;
      color: #0f172a;
      text-transform: uppercase;
    }
    .brand-orange {
      color: #ff7a00;
    }
    .brand-sub {
      font-size: 8pt;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      margin-top: 1mm;
    }
    .brand-contact {
      font-size: 7.8pt;
      color: #94a3b8;
      margin-top: 2mm;
    }
    .receipt-title-box {
      text-align: right;
    }
    .receipt-title {
      font-size: 16pt;
      font-weight: 900;
      color: #ea580c;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .receipt-number {
      font-size: 11pt;
      font-weight: 800;
      color: #0f172a;
      margin-top: 1.5mm;
    }
    .paid-badge {
      display: inline-block;
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #86efac;
      font-size: 8.5pt;
      font-weight: 800;
      padding: 1.5mm 4mm;
      border-radius: 2mm;
      letter-spacing: 0.5px;
      margin-top: 2.5mm;
      text-transform: uppercase;
    }
    .meta-table {
      width: 100%;
      margin-bottom: 7mm;
    }
    .meta-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 3mm;
      padding: 4mm 5mm;
    }
    .meta-label {
      font-size: 7.2pt;
      font-weight: 800;
      color: #ea580c;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2mm;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 1mm;
    }
    .meta-name {
      font-size: 11pt;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 1mm;
    }
    .meta-row {
      font-size: 8.5pt;
      color: #475569;
      margin-bottom: 0.8mm;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8mm;
    }
    .items-table th {
      background: #f8fafc;
      border-top: 1.5px solid #e2e8f0;
      border-bottom: 1.5px solid #cbd5e1;
      color: #475569;
      font-size: 8pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 3.5mm 4mm;
      text-align: left;
    }
    .items-table td {
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      padding: 4mm;
      font-size: 9.5pt;
      color: #1e293b;
    }
    .total-box {
      width: 100%;
      margin-bottom: 8mm;
    }
    .total-card {
      background: #f0fdf4;
      border: 1.5px solid #86efac;
      border-radius: 3mm;
      padding: 4mm 6mm;
      float: right;
      width: 72mm;
      text-align: right;
    }
    .total-label {
      font-size: 8pt;
      font-weight: 800;
      color: #166534;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .total-amount {
      font-size: 19pt;
      font-weight: 900;
      color: #15803d;
      margin-top: 1mm;
    }
    .qr-verification-section {
      clear: both;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 3mm;
      padding: 4mm 5mm;
      margin-top: 8mm;
    }
    .footer-note {
      text-align: center;
      font-size: 7.8pt;
      color: #94a3b8;
      margin-top: 10mm;
      border-top: 1px solid #f1f5f9;
      padding-top: 4mm;
    }
  </style>
</head>
<body>

  <!-- Header -->
  <table class="header-table" cellspacing="0" cellpadding="0">
    <tr>
      <td width="60%" valign="top">
        <div class="brand-title">TIGAT <span class="brand-orange">GYM</span></div>
        <div class="brand-sub">Fitness &amp; Performance Center &bull; Addis Ababa, Ethiopia</div>
        <div class="brand-contact">
          Phone: +251 911 234567 &bull; Email: support@tigatgym.com
        </div>
      </td>
      <td width="40%" valign="top" class="receipt-title-box">
        <div class="receipt-title">Official Receipt</div>
        <div class="receipt-number">{{ $payment->receipt_number }}</div>
        <div><span class="paid-badge">PAID IN FULL</span></div>
      </td>
    </tr>
  </table>

  <!-- Meta Information -->
  <table class="meta-table" cellspacing="0" cellpadding="0">
    <tr>
      <td width="48%" valign="top">
        <div class="meta-card">
          <div class="meta-label">Billed To (Member Details)</div>
          <div class="meta-name">{{ $user->name }}</div>
          <div class="meta-row">
            Member ID: <strong style="color: #ff7a00;">{{ $memberCode }}</strong>
          </div>
          @if(!empty($user->email))
          <div class="meta-row">Email: {{ $user->email }}</div>
          @endif
          @if(!empty($user->phone))
          <div class="meta-row">Phone: {{ $user->phone }}</div>
          @endif
        </div>
      </td>
      <td width="4%"></td>
      <td width="48%" valign="top">
        <div class="meta-card">
          <div class="meta-label">Payment &amp; Security References</div>
          <div class="meta-row" style="margin-top: 1mm;">
            Payment Ref: <strong style="color: #0f172a;">{{ $payment->payment_number }}</strong>
          </div>
          @if(!empty($chapaReference))
          <div class="meta-row">
            Chapa Ref: <strong style="color: #0f172a;">{{ $chapaReference }}</strong>
          </div>
          @endif
          <div class="meta-row">
            Date &amp; Time: <strong>{{ $paymentDateFormatted }}</strong>
          </div>
          <div class="meta-row">
            Payment Method: <strong style="text-transform: uppercase;">{{ str_replace('_', ' ', $payment->payment_method) }}</strong>
          </div>
          <div class="meta-row">
            Status: <strong style="color: #16a34a;">CONFIRMED &amp; VERIFIED</strong>
          </div>
        </div>
      </td>
    </tr>
  </table>

  <!-- Itemized Breakdown -->
  <table class="items-table">
    <thead>
      <tr>
        <th width="48%">Description / Package</th>
        <th width="32%">Validity Period</th>
        <th width="20%" style="text-align: right;">Amount (ETB)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <strong style="color: #0f172a; font-size: 10pt;">{{ $planName }}</strong>
          <div style="font-size: 8pt; color: #64748b; margin-top: 1mm;">
            Official Tigat Gym membership package with turnstile access &amp; facility usage.
          </div>
        </td>
        <td style="font-size: 9pt; color: #059669; font-weight: 700;">
          {{ $validityPeriod ?? 'Immediate Activation' }}
        </td>
        <td style="text-align: right; font-weight: 800; font-size: 11pt; color: #0f172a;">
          {{ number_format($payment->amount, 2) }} ETB
        </td>
      </tr>
    </tbody>
  </table>

  <!-- Total Summary -->
  <div class="total-box">
    <div class="total-card">
      <div class="total-label">Total Amount Paid</div>
      <div class="total-amount">{{ number_format($payment->amount, 2) }} ETB</div>
      <div style="font-size: 7.5pt; color: #166534; margin-top: 1mm; font-weight: 700;">
        STATUS: CONFIRMED &amp; VERIFIED
      </div>
    </div>
  </div>

  <!-- QR Verification Section -->
  <div class="qr-verification-section">
    <table width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td width="66" valign="middle">
          @if(!empty($qrCodeDataUri))
            <img src="{{ $qrCodeDataUri }}" width="60" height="60" style="display:block; border: 1.2px solid #ff7a00; border-radius: 4px; padding: 2px;" alt="QR" />
          @endif
        </td>
        <td style="padding-left: 5mm;" valign="middle">
          <div style="font-size: 9.5pt; font-weight: 800; color: #0f172a; text-transform: uppercase;">
            Turnstile &amp; Digital Verification Pass
          </div>
          <div style="font-size: 8.2pt; color: #64748b; margin-top: 1.5mm; line-height: 1.4;">
            This verified receipt confirms payment of <strong>{{ number_format($payment->amount, 2) }} ETB</strong>. The embedded optical QR code grants active turnstile admission for member <strong>{{ $memberCode }}</strong>.
          </div>
        </td>
      </tr>
    </table>
  </div>

  <div class="footer-note">
    Thank you for training with TIGAT GYM! Stay strong and build your best self. &bull; Official Digital Tax Receipt generated by GymCore.
  </div>

</body>
</html>
