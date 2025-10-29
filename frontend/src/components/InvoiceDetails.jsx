import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import API from "../services/api"; // ensure this path is correct
import { Package, Truck, Clock } from "lucide-react";

function InvoiceDetails() {
  const { id } = useParams(); // invoiceNo from URL
  const location = useLocation();
  const stateInvoice = location.state?.invoice; // get invoice from link state if available
  const [invoice, setInvoice] = useState(stateInvoice || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchInvoiceItems = async () => {
      try {
        setLoading(true);

        // Fetch the invoice data from SAP API
        const res = await API.get(`/sap/invoices/${id}`);
        console.log("Invoice API response:", res.data);

        if (res.data) {
          // Map DocumentLines to frontend items
          const items = res.data.DocumentLines?.map(line => ({
            itemCode: line.ItemCode,
            description: line.Dscription,
            qty: line.Quantity,
            price: line.Price,
            total: line.Quantity * line.Price
          })) || [];

          // Merge items into the existing invoice state (keep header fields intact)
          setInvoice(prev => ({
            ...prev,
            items
          }));
        } else {
          setError("⚠️ No invoice items found from API");
        }
      } catch (err) {
        console.error(err);
        setError("⚠️ Failed to fetch invoice items");
      } finally {
        setLoading(false);
      }
    };

    // Only fetch items if they are not already in stateInvoice
    if (!invoice?.items || invoice.items.length === 0) {
      fetchInvoiceItems();
    } else {
      setLoading(false);
    }
  }, [id]);

  const renderStatus = (status) => {
    switch (status) {
      case "Open":
        return (
          <span className="flex items-center text-blue-600">
            <Package size={16} className="mr-1" /> {status}
          </span>
        );
      case "Delivered":
        return (
          <span className="flex items-center text-green-600">
            <Truck size={16} className="mr-1" /> {status}
          </span>
        );
      case "In Transit":
        return (
          <span className="flex items-center text-orange-600">
            <Clock size={16} className="mr-1" /> {status}
          </span>
        );
      default:
        return status;
    }
  };

  if (loading)
    return (
      <div className="p-6 text-gray-500 font-medium">
        Loading invoice details...
      </div>
    );

  if (error)
    return (
      <div className="p-6 text-red-600 font-semibold">{error}</div>
    );

  if (!invoice)
    return (
      <div className="p-6 text-red-600 font-semibold">
        ⚠️ Invoice not found
      </div>
    );

  // Calculate totals dynamically
  const subtotal = invoice.items?.reduce((sum, item) => sum + item.qty * item.price, 0) || 0;
  const finalTotal = subtotal - (invoice.discount || 0) + (invoice.vat || 0);

  return (
    <div className="p-6 space-y-8 bg-white rounded-xl shadow-md">
      {/* Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
        <div className="space-y-1">
          <p>
            <span className="font-semibold">Invoice No:</span> {invoice.invoiceNo || invoice.id}
          </p>
          <p>
            <span className="font-semibold">PO Number:</span> {invoice.poNo || invoice.ponum}
          </p>
          <p>
            <span className="font-semibold">Invoice Date:</span> {invoice.postingDate || invoice.invoiceDate}
          </p>
          <p>
            <span className="font-semibold">Due Date:</span> {invoice.dueDate || invoice.DocDueDate}
          </p>
          <p>
            <span className="font-semibold">Status:</span> {renderStatus(invoice.status || invoice.DocumentStatus)}
          </p>
        </div>

        {/* Bill To / Ship To */}
        <div className="flex justify-end">
          <div className="text-left">
            <h3 className="font-semibold text-sm">Bill To</h3>
            <p className="text-xs">{invoice.billTo}</p>
          </div>
        </div>

        <div className="flex justify-end">
          <div className="text-left pr-6">
            <h3 className="font-semibold text-sm">Ship To</h3>
            <p className="text-xs">{invoice.shipTo}</p>
          </div>
        </div>
      </div>

      {/* Items Table */}
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
            {invoice.items?.length > 0 ? (
              invoice.items.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border px-3 py-2 text-center">{index + 1}</td>
                  <td className="border px-3 py-2">{item.itemCode}</td>
                  <td className="border px-3 py-2">{item.description}</td>
                  <td className="border px-3 py-2 text-center">{item.qty}</td>
                  <td className="border px-3 py-2 text-right">{invoice.currency} {item.price}</td>
                  <td className="border px-3 py-2 text-right">{invoice.currency} {item.total}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-500">
                  Items not loaded. Please refresh.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Totals */}
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
