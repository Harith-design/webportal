import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import API from "../services/api";

function InvoiceDetails() {
  const { id } = useParams();  // invoiceNo in the path
  const location = useLocation();
  const docEntryQP = new URLSearchParams(location.search).get("de"); // docEntry in query param

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFromDetails = async (docEntry, header) => {
      try {
        const det = await API.get(`/sap/invoices/${docEntry}/details`);
        const payload = det.data?.data;

        // Log the response to ensure data is being received
        console.log("Fetched Invoice Details:", payload);  // Debug log here

        let items = [];
        if (payload?.DocumentLines?.length) {
          // Map the items to display the code and description
          items = payload.DocumentLines.map((line, idx) => ({
            no: idx + 1,
            itemCode: line.ItemCode || "-",
            description: line.ItemDescription || "-",
            qty: Number(line.Quantity || 0),
            price: Number(line.Price || 0),
            total: Number(line.LineTotal || 0),
          }));
        }

        if (!items.length) {
          items = [
            {
              no: 1,
              itemCode: "-",
              description: "Item details not available",
              qty: 1,
              price: Number(header.total || 0),
              total: Number(header.total || 0),
            },
          ];
        }

        const updatedInvoice = { ...(header || {}), items };
        setInvoice(updatedInvoice);

        console.log("Updated Invoice State:", updatedInvoice); // Debug log after state update
      } catch (e) {
        console.error("Details fetch failed:", e);
        setInvoice((prev) => ({
          ...(prev || {}),
          items: [
            {
              no: 1,
              itemCode: "-",
              description: "Item details not available",
            },
          ],
        }));
      }
    };

    const fetchInvoice = async () => {
      try {
        setLoading(true);

        // current user for company filter
        const userStr =
          localStorage.getItem("user") || sessionStorage.getItem("user");
        const userModel = JSON.parse(userStr || "{}");

        const buildHeader = (found) => ({
          invoiceNo: found.invoiceNo,
          poNo: found.poNo || "-",
          customer: found.customer || "-",
          postingDate: found.postingDate || found.orderDate || "-",
          dueDate: found.dueDate || "-",
          status: found.status || "Open",
          currency: found.currency || "RM",
          billTo: found.billTo || "",
          shipTo: found.shipTo || "",
          discount: found.discount || 0,
          vat: found.vat || 0,
          total: found.total || 0,
          docEntry: found.docEntry || null,
          items: [],
        });

        if (docEntryQP) {
          const listRes = await API.get(`/sap/invoices`);
          const list = (listRes.data?.data || []).filter(
            (v) => v.customerCode === userModel.cardcode
          );
          const foundHeader = list.find(
            (v) => v.invoiceNo?.toString() === id?.toString()
          );
          const header = buildHeader(
            foundHeader || {
              invoiceNo: id,
              poNo: "-",
              customer: "-",
              postingDate: "-",
              dueDate: "-",
              status: "Open",
              currency: "RM",
              total: 0,
              docEntry: docEntryQP,
            }
          );
          setInvoice(header);

          await fetchFromDetails(docEntryQP, header);
          return;
        }

        const res = await API.get(`/sap/invoices`);
        const list = (res.data?.data || []).filter(
          (v) => v.customerCode === userModel.cardcode
        );
        const found = list.find(
          (v) => v.invoiceNo?.toString() === id?.toString()
        );

        if (!found) {
          setError("Invoice not found or does not belong to your company.");
          return;
        }

        const header = buildHeader(found);
        setInvoice(header);

        if (found.docEntry) {
          await fetchFromDetails(found.docEntry, header);
        } else {
          setInvoice((prev) => ({
            ...(prev || header),
            items: [
              {
                no: 1,
                itemCode: "-",
                description: "Item details not available",
              },
            ],
          }));
        }
      } catch (err) {
        console.error("Error fetching invoice:", err);
        setError("Failed to load invoice details.");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id, docEntryQP]);

  if (loading) {
    return (
      <div className="p-6 text-gray-500 font-medium">
        Loading invoice details...
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-red-600 font-semibold">{error}</div>;
  }

  if (!invoice) {
    return (
      <div className="p-6 text-red-600 font-semibold">⚠️ Invoice not found</div>
    );
  }

  const subtotal =
    invoice.items?.reduce(
      (sum, item) => sum + Number(item.qty) * Number(item.price),
      0
    ) || 0;
  const finalTotal = subtotal - (invoice.discount || 0) + (invoice.vat || 0);

  const renderStatus = (status) => {
    switch (status) {
      case "Open":
        return <span className="text-blue-600">Open</span>;
      case "Closed":
      case "Delivered":
        return <span className="text-green-600">Delivered</span>;
      case "In Transit":
        return <span className="text-orange-600">In Transit</span>;
      default:
        return status;
    }
  };

  return (
    <div className="p-6 space-y-8 bg-white rounded-xl shadow-md">
      {/* Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
        <div className="space-y-1">
          <p>
            <span className="font-semibold">Invoice No:</span>{" "}
            {invoice.invoiceNo}
          </p>
          <p>
            <span className="font-semibold">PO Number:</span> {invoice.poNo}
          </p>
          <p>
            <span className="font-semibold">Invoice Date:</span>{" "}
            {invoice.postingDate}
          </p>
          <p>
            <span className="font-semibold">Due Date:</span> {invoice.dueDate}
          </p>
          <p>
            <span className="font-semibold">Status:</span>{" "}
            {renderStatus(invoice.status)}
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-sm">Bill To</h3>
          <p className="text-xs">{invoice.billTo || "-"}</p>
        </div>

        <div>
          <h3 className="font-semibold text-sm">Ship To</h3>
          <p className="text-xs">{invoice.shipTo || "-"}</p>
        </div>
      </div>

      {/* Items */}
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
            {invoice.items?.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="border px-3 py-2 text-center">
                  {item.no || index + 1}
                </td>
                <td className="border px-3 py-2">{item.itemCode}</td>
                <td className="border px-3 py-2">{item.description}</td>
                <td className="border px-3 py-2 text-center">{item.qty}</td>
                <td className="border px-3 py-2 text-right">
                  {invoice.currency} {Number(item.price).toFixed(2)}
                </td>
                <td className="border px-3 py-2 text-right">
                  {invoice.currency} {Number(item.total).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="max-w-sm ml-auto text-sm space-y-1">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>
            {invoice.currency} {subtotal.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Discount:</span>
          <span>
            - {invoice.currency} {(invoice.discount || 0).toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>VAT:</span>
          <span>
            + {invoice.currency} {(invoice.vat || 0).toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between font-semibold text-gray-800 border-t pt-2">
          <span>Final Amount:</span>
          <span>
            {invoice.currency} {finalTotal.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default InvoiceDetails;
