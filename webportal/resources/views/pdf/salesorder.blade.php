<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Sales Order {{ $DocNum }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #333; }
        h1 { text-align: center; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ccc; padding: 6px; text-align: left; }
        th { background-color: #f2f2f2; }
        .right { text-align: right; }
    </style>
</head>
<body>
    <h1>Sales Order #{{ $DocNum }}</h1>
    <p><strong>Customer:</strong> {{ $Customer }} ({{ $CardCode }})</p>
    <p><strong>Date:</strong> {{ $DocDate }} &nbsp;&nbsp; <strong>Due:</strong> {{ $DocDueDate }}</p>
    <p><strong>Status:</strong> {{ $Status }} &nbsp;&nbsp; <strong>PO No:</strong> {{ $PONum }}</p>

    <table>
        <thead>
            <tr>
                <th>No.</th>
                <th>Item Code</th>
                <th>Description</th>
                <th class="right">Qty</th>
                <th class="right">Unit Price</th>
                <th class="right">Line Total</th>
            </tr>
        </thead>
        <tbody>
        @foreach($Lines as $line)
            <tr>
                <td>{{ $line['no'] }}</td>
                <td>{{ $line['ItemCode'] }}</td>
                <td>{{ $line['Description'] }}</td>
                <td class="right">{{ number_format($line['Quantity'], 2) }}</td>
                <td class="right">{{ $Currency }} {{ number_format($line['UnitPrice'], 2) }}</td>
                <td class="right">{{ $Currency }} {{ number_format($line['LineTotal'], 2) }}</td>
            </tr>
        @endforeach
        </tbody>
    </table>

    <br><br>
    <table style="width: 40%; float: right;">
        <tr><td>Subtotal:</td><td class="right">{{ $Currency }} {{ number_format($Subtotal, 2) }}</td></tr>
        <tr><td>Discount:</td><td class="right">- {{ $Currency }} {{ number_format($Discount, 2) }}</td></tr>
        <tr><td>VAT:</td><td class="right">+ {{ $Currency }} {{ number_format($VAT, 2) }}</td></tr>
        <tr><th>Total:</th><th class="right">{{ $Currency }} {{ number_format($Grand, 2) }}</th></tr>
    </table>
</body>
</html>
