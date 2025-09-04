import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../services/api"; // 👈 make sure this path is correct

function InvoiceDetails() {
  const { id } = useParams(); // id = DocEntry from SAP
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await API.get(`/sap/invoices/${id}`);
        setInvoice(res.data); // make sure backend returns invoice in expected format
      } catch (err) {
        console.error(err);
        setError("⚠️ Failed to fetch invoice data");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  if (loading) return <p className="p-6 text-gray-600">Loading invoice...</p>;
  if (error) return <p className="p-6 text-red-600 font-semibold">{error}</p>;
  if (!invoice) return <p className="p-6 text-red-600 font-semibold">⚠️ Invoice not found</p>;

  // Calculate totals dynamically
  const subtotal = invoice.items.reduce((sum, item) => sum + item.qty * item.price, 0);
  const finalTotal = subtotal - (invoice.discount || 0) + (invoice.vat || 0);

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
              invoice.status === "Delivered" ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"
            }`}>
              {invoice.status}
            </span>
          </p>
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
            {invoice.items.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="border px-3 py-2 text-center">{index + 1}</td>
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
          <span>- {invoice.currency} {invoice.discount || 0}</span>
        </div>
        <div className="flex justify-between">
          <span>VAT:</span>
          <span>+ {invoice.currency} {invoice.vat || 0}</span>
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
