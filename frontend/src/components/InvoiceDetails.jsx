import React from "react";
import { useParams } from "react-router-dom";

function InvoiceDetails() {
  const { id } = useParams();

  // Dummy invoice data
  const invoices = [
    {
      id: 1001,
      ponum: "PO-98765",
      invoiceDate: "25-08-2025",
      dueDate: "30-08-2025",
      total: 1200,
      currency: "RM",
      status: "Open",
      billTo: "ABC Headquarters, KL",
      shipTo: "Warehouse A, Selangor",
      items: [
        { no: 1, name: "Tyre A", desc: "Radial tyre 15 inch", qty: 4, price: 200 },
        { no: 2, name: "Tyre B", desc: "Tubeless tyre 17 inch", qty: 2, price: 300 },
      ],
      discount: 100,
      vat: 72,
    },
    {
      id: 1002,
      ponum: "PO-54321",
      invoiceDate: "24-08-2025",
      dueDate: "29-08-2025",
      total: 800,
      currency: "RM",
      status: "Paid",
      billTo: "XYZ Corp, Penang",
      shipTo: "Port Klang, Selangor",
      items: [
        { no: 1, name: "Battery A", desc: "Car battery 12V", qty: 1, price: 400 },
        { no: 2, name: "Battery B", desc: "Truck battery 24V", qty: 2, price: 200 },
      ],
      discount: 20,
      vat: 40,
    },
  ];

  const invoice = invoices.find((inv) => inv.id === parseInt(id));

  if (!invoice) {
    return <p className="p-6 text-red-600 font-semibold">⚠️ Invoice not found</p>;
  }

  // Calculate totals
  const subtotal = invoice.items.reduce((sum, item) => sum + item.qty * item.price, 0);
  const finalTotal = subtotal - invoice.discount + invoice.vat;

  return (
    <div className="p-6 space-y-8 bg-white rounded-xl shadow-md">
      {/* Section 1: Invoice Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
        <div className="space-y-1">
          <p><span className="font-semibold">Invoice No:</span> {invoice.id}</p>
          <p><span className="font-semibold">PO Number:</span> {invoice.ponum}</p>
          <p><span className="font-semibold">Invoice Date:</span> {invoice.invoiceDate}</p>
          <p><span className="font-semibold">Due Date:</span> {invoice.dueDate}</p>
          <p><span className="font-semibold">Status:</span> 
            <span className={`ml-1 px-2 py-0.5 rounded text-xs ${
              invoice.status === "Paid" ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"
            }`}>
              {invoice.status}
            </span>
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-gray-700">Bill To</h3>
          <p className="text-xs">{invoice.billTo}</p>
        </div>

        <div>
          <h3 className="font-semibold text-gray-700">Ship To</h3>
          <p className="text-xs">{invoice.shipTo}</p>
        </div>
      </div>

      {/* Section 2: Items Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 text-xs">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-3 py-2">No.</th>
              <th className="border px-3 py-2">Item</th>
              <th className="border px-3 py-2">Description</th>
              <th className="border px-3 py-2">Qty</th>
              <th className="border px-3 py-2">Price</th>
              <th className="border px-3 py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr key={item.no} className="hover:bg-gray-50">
                <td className="border px-3 py-2 text-center">{item.no}</td>
                <td className="border px-3 py-2">{item.name}</td>
                <td className="border px-3 py-2">{item.desc}</td>
                <td className="border px-3 py-2 text-center">{item.qty}</td>
                <td className="border px-3 py-2 text-right">
                  {invoice.currency} {item.price}
                </td>
                <td className="border px-3 py-2 text-right">
                  {invoice.currency} {item.qty * item.price}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Section 3: Totals */}
      <div className="max-w-sm ml-auto text-sm space-y-1">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{invoice.currency} {subtotal}</span>
        </div>
        <div className="flex justify-between">
          <span>Discount:</span>
          <span>- {invoice.currency} {invoice.discount}</span>
        </div>
        <div className="flex justify-between">
          <span>VAT:</span>
          <span>+ {invoice.currency} {invoice.vat}</span>
        </div>
        <div className="flex justify-between font-semibold text-gray-800 border-t pt-2">
          <span>Final Amount:</span>
          <span>{invoice.currency} {finalTotal}</span>
        </div>
      </div>
    </div>
  );
}

export default InvoiceDetails;