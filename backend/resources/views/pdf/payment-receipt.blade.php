<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tigat Gym - Official Payment Receipt</title>
  <style>
    @page {
      margin: 15mm;
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
      font-size: 10pt;
      line-height: 1.5;
    }
    .header-table {
      width: 100%;
      border-bottom: 2px solid #ff7a00;
      padding-bottom: 8mm;
      margin-bottom: 8mm;
    }
    .brand-title {
      font-size: 24pt;
      font-weight: 900;
      letter-spacing: 1px;
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
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-top: 2px;
    }
    .receipt-title-box {
      text-align: right;
    }
    .receipt-title {
      font-size: 16pt;
      font-weight: 900;
      color: #ff7a00;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .receipt-number {
      font-size: 11pt;
      font-weight: 800;
      font-family: 'Courier New', Courier, monospace;
      color: #0f172a;
      margin-top: 2px;
    }
    .paid-badge {
      display: inline-block;
      background: #16a34a;
      color: #ffffff;
      font-size: 9pt;
      font-weight: 900;
      padding: 2mm 5mm;
      border-radius: 3mm;
      letter-spacing: 1px;
      margin-top: 3mm;
      text-transform: uppercase;
    }
    .meta-table {
      width: 100%;
      margin-bottom: 8mm;
    }
    .meta-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 4mm;
      padding: 4mm 5mm;
    }
    .meta-label {
      font-size: 7.5pt;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      margin-bottom: 1.5mm;
    }
    .meta-value {
      font-size: 10.5pt;
      font-weight: 800;
      color: #0f172a;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8mm;
    }
    .items-table th {
      background: #0f172a;
      color: #ffffff;
      font-size: 8pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 3.5mm 4mm;
      text-align: left;
    }
    .items-table td {
      border-bottom: 1px solid #e2e8f0;
      padding: 4mm;
      font-size: 9.5pt;
      color: #1e293b;
    }
    .total-box {
      width: 100%;
      margin-bottom: 10mm;
    }
    .total-card {
      background: #f0fdf4;
      border: 1.5px solid #86efac;
      border-radius: 4mm;
      padding: 4mm 6mm;
      float: right;
      width: 70mm;
    }
    .total-label {
      font-size: 8pt;
      font-weight: 800;
      color: #166534;
      text-transform: uppercase;
    }
    .total-amount {
      font-size: 18pt;
      font-weight: 900;
      color: #15803d;
      margin-top: 1mm;
    }
    .qr-verification-section {
      clear: both;
      border-top: 1px dashed #cbd5e1;
      padding-top: 6mm;
      margin-top: 10mm;
    }
    .footer-note {
      text-align: center;
      font-size: 8pt;
      color: #94a3b8;
      margin-top: 10mm;
      border-top: 1px solid #e2e8f0;
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
        <div class="brand-sub">Fitness & Performance Center • Addis Ababa, Ethiopia</div>
        <div style="font-size: 8pt; color: #64748b; margin-top: 2mm;">
          Phone: +251 911 234567 • Email: support@tigatgym.com
        </div>
      </td>
      <td width="40%" valign="top" class="receipt-title-box">
        <div class="receipt-title">Official Receipt</div>
        <div class="receipt-number">{{ $payment->receipt_number }}</div>
        <div><span class="paid-badge">PAID IN FULL</span></div>
      </td>
    </tr>
  </table>

  <!-- Meta Information (Member & Transaction details) -->
  <table class="meta-table" cellspacing="0" cellpadding="0">
    <tr>
      <td width="48%" valign="top">
        <div class="meta-box">
          <div class="meta-label">Billed To (Member Details)</div>
          <div class="meta-value">{{ $user->name }}</div>
          <div style="font-size: 8.5pt; color: #64748b; margin-top: 1mm;">
            Member ID: <strong style="color: #ff7a00;">{{ $memberCode }}</strong>
          </div>
          @if(!empty($user->email))
          <div style="font-size: 8.5pt; color: #64748b;">
            Email: {{ $user->email }}
          </div>
          @endif
          @if(!empty($user->phone))
          <div style="font-size: 8.5pt; color: #64748b;">
            Phone: {{ $user->phone }}
          </div>
          @endif
        </div>
      </td>
      <td width="4%"></td>
      <td width="48%" valign="top">
        <div class="meta-box">
          <div class="meta-label">Payment & Security References</div>
          <div style="font-size: 9pt; color: #0f172a; margin-bottom: 1mm;">
            Payment Ref: <strong style="font-family: monospace;">{{ $payment->payment_number }}</strong>
          </div>
          @if(!empty($chapaReference))
          <div style="font-size: 8.5pt; color: #0f172a; margin-bottom: 1mm;">
            Chapa Ref: <strong style="font-family: monospace;">{{ $chapaReference }}</strong>
          </div>
          @endif
          <div style="font-size: 8.5pt; color: #64748b;">
            Date: {{ $paymentDateFormatted }}
          </div>
          <div style="font-size: 8.5pt; color: #64748b;">
            Method: <strong style="text-transform: uppercase;">{{ str_replace('_', ' ', $payment->payment_method) }}</strong>
          </div>
        </div>
      </td>
    </tr>
  </table>

  <!-- Itemized Breakdown -->
  <table class="items-table">
    <thead>
      <tr>
        <th width="50%">Description / Package</th>
        <th width="30%">Validity Period</th>
        <th width="20%" style="text-align: right;">Amount (ETB)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <strong style="color: #0f172a;">{{ $planName }}</strong>
          <div style="font-size: 8pt; color: #64748b; margin-top: 1mm;">
            Official Tigat Gym membership package with turnstile access & facility usage.
          </div>
        </td>
        <td style="font-size: 8.5pt; color: #059669; font-weight: 700;">
          {{ $validityPeriod ?? 'Immediate Activation' }}
        </td>
        <td style="text-align: right; font-weight: 800; font-size: 10.5pt; color: #0f172a;">
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
        STATUS: CONFIRMED & VERIFIED
      </div>
    </div>
  </div>

  <!-- QR Verification & Turnstile info -->
  <div class="qr-verification-section">
    <table width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td width="70" valign="middle">
          @if(!empty($qrCodeDataUri))
            <img src="{{ $qrCodeDataUri }}" width="64" height="64" style="display:block; border: 1px solid #cbd5e1; border-radius: 4px;" alt="QR" />
          @endif
        </td>
        <td style="padding-left: 5mm;" valign="middle">
          <div style="font-size: 9pt; font-weight: 800; color: #0f172a; text-transform: uppercase;">
            Turnstile & Digital Verification Pass
          </div>
          <div style="font-size: 8pt; color: #64748b; margin-top: 1mm;">
            This QR code verifies your payment of <strong>{{ number_format($payment->amount, 2) }} ETB</strong> and grants active turnstile access for member <strong>{{ $memberCode }}</strong>.
          </div>
        </td>
      </tr>
    </table>
  </div>

  <div class="footer-note">
    Thank you for training with TIGAT GYM! Stay strong and build your best self. • This is an automated official digital tax receipt generated by GymCore.
  </div>

</body>
</html>
