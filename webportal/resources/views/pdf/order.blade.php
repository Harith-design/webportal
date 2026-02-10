<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Sales Order {{ $DocNum ?? '' }}</title>

  <style>
    @page { margin: 18px 22px 18px 22px; }

    body {
      font-family: DejaVu Sans, Arial, Helvetica, sans-serif;
      font-size: 11px;
      color: #111;
      margin: 0;
    }

    /* Helpers */
    .right { text-align: right; }
    .center { text-align: center; }
    .muted { color: #666; }
    .bold { font-weight: 700; }
    .small { font-size: 10px; }
    .pre { white-space: pre-wrap; line-height: 1.35; }

    /* Header */
    .hdr { width: 100%; border-collapse: collapse; margin-top: 4px; }
    .hdr td { vertical-align: top; padding: 0; border: 0; }

    /* ✅ 1) Better title styling (bold + more premium look, DomPDF-safe) */
    .title {
      font-family: DejaVu Sans, Arial, Helvetica, sans-serif;
      font-size: 22px;
      letter-spacing: 1.2px;
      font-weight: 700;
      margin-top: 0;
      text-transform: uppercase;
      line-height: 1.05;
    }

    .logo-wrap { text-align: right; }
    .logo-img {
      width: 78px;
      height: auto;
      display: inline-block;
      margin-top: 0;
      margin-bottom: 10; /* ✅ 2) remove gap under logo */
    }

    /* ✅ 2) Keep logo-sub closer to logo */
    .logo-sub {
      font-size: 9px;
      letter-spacing: 2px;
      margin-top: 0;          /* was 2px */
      padding-top: 0;         /* make it closer */
      text-transform: uppercase;
      color: #444;
      line-height: 1.1;
    }

    /* Supplier line under header */
    .supplier-line {
      margin-top: 32px;
      font-size: 9px;
      color: #666;
    }

    /* Party + meta */
    .info { width: 100%; border-collapse: collapse; margin-top: 18px; }
    .info td { vertical-align: top; padding: 0; border: 0; }

    .for-label {
      font-weight: 700;
      font-size: 10px;
      margin-bottom: 6px;
      text-transform: uppercase;
    }

    .addr { font-size: 10px; line-height: 1.35; }

    .meta { width: 100%; border-collapse: collapse; }
    .meta td { border: 0; padding: 2px 0; font-size: 10px; }
    .meta .k { width: 70px; color: #444; }
    .meta .v { width: 120px; text-align: right; }
    .meta .v strong { font-weight: 700; }

    /* Lines table */
    table.lines {
      width: 100%;
      border-collapse: collapse;
      margin-top: 28px;
      font-size: 10px;
    }
    .lines th, .lines td {
      border: 1px solid #cfcfcf;
      padding: 7px 8px;
      vertical-align: top;
    }
    .lines thead th {
      background: #e9e9e9;
      font-weight: 700;
      color: #333;
      text-transform: uppercase;
      font-size: 9px;
      letter-spacing: 0.3px;
    }
    .lines .col-desc { width: 56%; }
    .lines .col-qty  { width: 14%; }
    .lines .col-unit { width: 15%; }
    .lines .col-amt  { width: 15%; }

    /* DOMPDF safety */
    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }
    tr { page-break-inside: avoid; }

    /* Totals box */
    .totals-wrap {
      width: 260px;
      margin-left: auto;
      margin-top: 14px;
    }
    table.totals {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }
    .totals td {
      border: 1px solid #cfcfcf;
      padding: 7px 10px;
    }
    .totals .row1 td {
      background: #fff;
      font-weight: 700;
      color: #444;
      text-transform: uppercase;
      letter-spacing: 0.2px;
      font-size: 9px;
    }
    .totals .row2 td {
      background: #111;
      color: #fff;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.2px;
      font-size: 9px;
      border-color: #111;
    }
    .totals .label { width: 65%; }
    .totals .value { width: 35%; text-align: right; }

    /* ✅ 3) Footer note fixed at bottom-right */
    .sys-note-footer {
      position: fixed;
      right: 22px;
      bottom: 14px;
      font-size: 9px;
      color: #666;
      text-align: right;
    }
  </style>
</head>

<body>
  @php
    $fmt = function($n){ return number_format((float)$n, 2, '.', ','); };
    $currency = trim($Currency ?? '');
    $shipText = $ShipToText ?? '';
    $billText = $BillToText ?? '';
  @endphp

  <!-- HEADER -->
  <table class="hdr">
    <tr>
      <td style="width:60%;">
        <div class="title">PURCHASE ORDER</div>
      </td>

      <td style="width:40%;" class="logo-wrap">
        @if(!empty($LogoDataUri))
          <img class="logo-img" src="{{ $LogoDataUri }}" alt="GIIB Logo">
        @endif
        <div class="logo-sub">SALES ORDER</div>
      </td>
    </tr>
  </table>

  <!-- Supplier line -->
  <div class="supplier-line">
    {{ $SupplierAddressLine ?? '' }}
  </div>

  <!-- FOR + META -->
  <table class="info">
    <tr>
      <td style="width:62%;">
        <div class="for-label">FOR</div>
        <div class="addr pre">{!! nl2br(e($shipText ?: '—')) !!}</div>
      </td>

      <td style="width:38%;">
        <table class="meta">
          <tr>
            <td class="k">Order No:</td>
            <td class="v"><strong>{{ $DocNum ?? '-' }}</strong></td>
          </tr>
          <tr>
            <td class="k">Issue date:</td>
            <td class="v"><strong>{{ $DocDate ?? '-' }}</strong></td>
          </tr>
          <tr>
            <td class="k">Due date:</td>
            <td class="v"><strong>{{ $DocDueDate ?? '-' }}</strong></td>
          </tr>
          <tr>
            <td class="k">PO No:</td>
            <td class="v"><strong>{{ $PONum ?? '-' }}</strong></td>
          </tr>
          <tr>
            <td class="k">Currency:</td>
            <td class="v"><strong>{{ $currency !== '' ? $currency : '—' }}</strong></td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- LINES -->
  <table class="lines">
    <thead>
      <tr>
        <th class="col-desc" style="text-align:left;">Description</th>
        <th class="col-qty center">Quantity</th>
        <th class="col-unit right">Unit Price ({{ $currency !== '' ? $currency : '—' }})</th>
        <th class="col-amt right">Amount ({{ $currency !== '' ? $currency : '—' }})</th>
      </tr>
    </thead>

    <tbody>
      @forelse(($Lines ?? []) as $row)
        <tr>
          <td><div>{{ $row['Description'] ?? '-' }}</div></td>
          <td class="center">{{ $fmt($row['Quantity'] ?? 0) }}</td>
          <td class="right">{{ $fmt($row['UnitPrice'] ?? 0) }}</td>
          <td class="right">{{ $fmt($row['LineTotal'] ?? 0) }}</td>
        </tr>
      @empty
        <tr>
          <td colspan="4" class="center muted">No items</td>
        </tr>
      @endforelse
    </tbody>
  </table>

  <!-- TOTALS -->
  <div class="totals-wrap">
    <table class="totals">
      <tr class="row1">
        <td class="label">TOTAL ({{ $currency !== '' ? $currency : '—' }}):</td>
        <td class="value">{{ $fmt($Grand ?? $Subtotal ?? 0) }}</td>
      </tr>
      <tr class="row2">
        <td class="label">TOTAL DUE ({{ $currency !== '' ? $currency : '—' }})</td>
        <td class="value">{{ $fmt($Grand ?? $Subtotal ?? 0) }}</td>
      </tr>
    </table>
  </div>

  <!-- ✅ 3) Footer fixed -->
  <div class="sys-note-footer">System generated document.</div>

</body>
</html>
