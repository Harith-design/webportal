<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice #{{ $DocNum }}</title>
  <style>
    *{ font-family: DejaVu Sans, Arial, Helvetica, sans-serif; }
    body{ font-size:12px; color:#111; }
    .row{ display:flex; justify-content:space-between; }
    .mt{ margin-top: 12px; }
    .box{ border:1px solid #ddd; padding:10px; border-radius:6px; }
    table{ width:100%; border-collapse:collapse; margin-top:10px; }
    th,td{ border:1px solid #ddd; padding:6px; }
    th{ background:#f3f3f3; text-align:left; }
    .right{ text-align:right; }
    .center{ text-align:center; }
  </style>
</head>
<body>
  <h2>Invoice #{{ $DocNum }}</h2>

  <div class="row">
    <div class="box" style="width:48%">
      <p><strong>Customer:</strong> {{ $Customer }}</p>
      <p><strong>BP Code:</strong> {{ $CardCode }}</p>
      <p><strong>PO Number:</strong> {{ $PONum }}</p>
    </div>
    <div class="box" style="width:48%">
      <p><strong>Invoice Date:</strong> {{ $DocDate }}</p>
      <p><strong>Due Date:</strong> {{ $DocDueDate }}</p>
      <p><strong>Status:</strong> {{ $Status }}</p>
    </div>
  </div>

  <table class="mt">
    <thead>
      <tr>
        <th class="center" style="width:40px">No.</th>
        <th style="width:120px">Item</th>
        <th>Description</th>
        <th class="right" style="width:70px">Qty</th>
        <th class="right" style="width:90px">Price ({{ $Currency }})</th>
        <th class="right" style="width:100px">Total ({{ $Currency }})</th>
      </tr>
    </thead>
    <tbody>
      @foreach($Lines as $l)
        <tr>
          <td class="center">{{ $l['no'] }}</td>
          <td>{{ $l['ItemCode'] }}</td>
          <td>{{ $l['Description'] }}</td>
          <td class="right">{{ number_format($l['Quantity'], 2) }}</td>
          <td class="right">{{ number_format($l['UnitPrice'], 2) }}</td>
          <td class="right">{{ number_format($l['LineTotal'], 2) }}</td>
        </tr>
      @endforeach
    </tbody>
  </table>

  <table class="mt" style="width:40%; margin-left:auto">
    <tr>
      <th>Subtotal</th>
      <td class="right">{{ $Currency }} {{ number_format($Subtotal, 2) }}</td>
    </tr>
    <tr>
      <th>Discount</th>
      <td class="right">- {{ $Currency }} {{ number_format($Discount, 2) }}</td>
    </tr>
    <tr>
      <th>VAT</th>
      <td class="right">+ {{ $Currency }} {{ number_format($VAT, 2) }}</td>
    </tr>
    <tr>
      <th>Final Amount</th>
      <td class="right"><strong>{{ $Currency }} {{ number_format($Grand, 2) }}</strong></td>
    </tr>
  </table>
</body>
</html>
