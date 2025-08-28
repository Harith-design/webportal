import React from "react";
import { useParams } from "react-router-dom";

function InvoiceDetails() {
  const { id } = useParams();

  // Dummy invoice data
  const invoices = [
  {
    id: 1001,  // match Invoices.jsx
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
    id: 1002,  // match Invoices.jsx
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
    return <p className="p-6 text-red-600">Invoice not found</p>;
  }

  // Calculate subtotal
  const subtotal = invoice.items.reduce(
    (sum, item) => sum + item.qty * item.price,
    0
  );
  const finalTotal = subtotal - invoice.discount + invoice.vat;

  return (
    <div className="p-6 space-y-6 bg-white p-4 rounded-xl shadow-md overflow-x-auto">
      {/* Section 1: Invoice Info, Bill To, Ship To */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-xs px-4">
          <p><span className="font-semibold">Invoice No:</span> {invoice.id}</p>
          <p><span className="font-semibold">PO Number:</span> {invoice.ponum}</p>
          <p><span className="font-semibold">Invoice Date:</span> {invoice.invoiceDate}</p>
          <p><span className="font-semibold">Due Date:</span> {invoice.dueDate}</p>
          <p><span className="font-semibold">Status:</span> {invoice.status}</p>
        </div>
        <div className="flex justify-end">
          <div className="text-left">
            <h3 className="font-semibold text-sm">Bill To</h3>
            <p className="text-xs">{invoice.billTo}</p>
          </div>
        </div>

        <div className="flex justify-end ">
          <div className="text-left pr-6">
            <h3 className="font-semibold text-sm">Ship To</h3>
            <p className="text-xs">{invoice.shipTo}</p>
          </div>
        </div>
      </div>

      {/* Section 2: Invoice Items Table */}
      <div className="p-4 overflow-x-auto">
        <table className="min-w-full border-collapse mt-4">
          <thead className="text-xs">
            <tr className="bg-gray-100">
              <th className="border px-4 py-2">No.</th>
              <th className="border px-4 py-2">Item Code</th>
              <th className="border px-4 py-2">Description</th>
              <th className="border px-4 py-2">Quantity</th>
              <th className="border px-4 py-2">Price</th>
              <th className="border px-4 py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr className="text-xs" key={item.no}>
                <td className="border px-4 py-2 text-center">{item.no}</td>
                <td className="border px-4 py-2">{item.name}</td>
                <td className="border px-4 py-2">{item.desc}</td>
                <td className="border px-4 py-2 text-center">{item.qty}</td>
                <td className="border px-4 py-2 text-center">
                  {invoice.currency} {item.price}
                </td>
                <td className="border px-4 py-2 text-center">
                  {invoice.currency} {item.qty * item.price}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Section 3: Totals */}
      <div className="p-4 max-w-md ml-auto text-xs">
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
        <div className="flex justify-between font-semibold">
          <span>Final Amount:</span>
          <span>{invoice.currency} {finalTotal}</span>
        </div>
      </div>
    </div>
  );
}

export default InvoiceDetails;
