import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import API from "../services/api";
import axios from "axios";
import { Receipt, FileCheck } from "lucide-react";

/* -------- Reusable Status Badge (same as OrderDetails) -------- */
const StatusBadge = ({ status }) => {
  const statusConfig = {
    Open: {
      label: "Open",
      icon: <Receipt size={14} className="mr-1" />,
      style: {
        background: "radial-gradient(circle at 30% 70%, #b2faffff, #afc9ffff)",
        color: "#007edf",
      },
    },
    Closed: {
      label: "Delivered",
      icon: <FileCheck size={14} className="mr-1" />,
      style: {
        background: "radial-gradient(circle at 20% 80%, #c9ffa4ff, #89fdbdff)",
        color: "#16aa3dff",
      },
    },
  };

  const cfg = statusConfig[status] || statusConfig.Open;

  return (
    <span
      className="inline-flex items-center rounded-xl px-2 text-xs font-medium"
      style={cfg.style}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
};

function InvoiceDetails() {
  const { id } = useParams();
  const location = useLocation();
  const docEntryQP = new URLSearchParams(location.search).get("de");

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Address states
  const [bpAddresses, setBpAddresses] = useState({ shipTo: [], billTo: [], defaults: {} });
  const [shipToFull, setShipToFull] = useState("");
  const [billToFull, setBillToFull] = useState("");

  const apiUrl = process.env.REACT_APP_BACKEND_API_URL;

  /* -------- Address Formatting (same as OrderDetails) -------- */
  const formatAddress = (a, labelOverride) => {
    if (!a) return "";
    const firstLine = labelOverride || a.AddressName || "";
    const lines = [
      firstLine,
      [a.Building, a.Street].filter(Boolean).join(", "),
      [a.ZipCode, a.City].filter(Boolean).join(" "),
      [a.County, a.Country].filter(Boolean).join(", "),
    ].filter(Boolean);

    return lines.join("\n");
  };

  const fetchBpAddresses = async (cardCode) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await axios.get(
        `${apiUrl}/api/sap/business-partners/${encodeURIComponent(cardCode)}/addresses`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.status === "success") {
        const pack = {
          shipTo: res.data.shipTo || [],
          billTo: res.data.billTo || [],
          defaults: res.data.defaults || {},
        };
        setBpAddresses(pack);
        return pack;
      }
    } catch (e) {
      console.error("BP address fetch failed:", e);
    }
    const fallback = { shipTo: [], billTo: [], defaults: {} };
    setBpAddresses(fallback);
    return fallback;
  };

  const setResolvedAddresses = (headerLike, bpAddr) => {
    const shipCode = headerLike?.shipTo || bpAddr.defaults?.shipTo || "";
    const billCode = headerLike?.billTo || bpAddr.defaults?.billTo || "";

    const shipObj =
      bpAddr.shipTo.find((x) => x.AddressName === shipCode) ||
      bpAddr.shipTo.find((x) => x.IsDefault) ||
      bpAddr.shipTo[0];

    const billObj =
      bpAddr.billTo.find((x) => x.AddressName === billCode) ||
      bpAddr.billTo.find((x) => x.IsDefault) ||
      bpAddr.billTo[0];

    setShipToFull(formatAddress(shipObj, "Ship To"));
    setBillToFull(formatAddress(billObj, "Bill To"));
  };

  /* -------- Fetch Invoice + Items -------- */
  useEffect(() => {
    const fetchItems = async (docEntry, header) => {
      try {
        const res = await API.get(`/sap/invoices/${docEntry}/details`);
        const payload = res.data?.data;

        let items = [];

        if (payload?.DocumentLines?.length) {
          items = payload.DocumentLines.map((line, idx) => ({
            no: idx + 1,
            itemCode: line.ItemCode,
            itemName: line.ItemDescription,
            qty: Number(line.Quantity),
            price: Number(line.Price),
            total: Number(line.LineTotal),
          }));
        }

        setInvoice({ ...header, items });
      } catch (e) {
        console.error("Details fetch failed:", e);
      }
    };

    const fetchInvoice = async () => {
      try {
        setLoading(true);

        const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
        const userModel = JSON.parse(userStr || "{}");

        const listRes = await API.get(`/sap/invoices`);
        const list = (listRes.data?.data || []).filter(
          (v) => v.customerCode === userModel.cardcode
        );

        const found = list.find((v) => v.invoiceNo?.toString() === id.toString());

        if (!found) {
          setError("Invoice not found or does not belong to your company.");
          return;
        }

        const header = {
          invoiceNo: found.invoiceNo,
          poNo: found.poNo,
          postingDate: found.postingDate,
          dueDate: found.dueDate,
          status: found.status,
          currency: found.currency || "RM",
          billTo: found.billTo,
          shipTo: found.shipTo,
          discount: Number(found.discount || 0),
          vat: Number(found.vat || 0),
          total: Number(found.total || 0),
        };

        setInvoice(header);

        const pack = await fetchBpAddresses(userModel.cardcode);
        setResolvedAddresses(header, pack);

        if (found.docEntry) {
          await fetchItems(found.docEntry, header);
        }
      } catch (e) {
        console.log("Error invoice fetch:", e);
        setError("Failed to load invoice details.");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id, docEntryQP, apiUrl]);

  if (loading) return <p className="p-6 text-gray-500">Loading invoice...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;
  if (!invoice) return <p className="p-6 text-gray-500">Invoice not found</p>;

  const subtotal = invoice.items?.reduce(
    (sum, item) => sum + item.qty * item.price,
    0
  );

  const finalTotal = subtotal - invoice.discount + invoice.vat;

  return (
    <div className="px-16 py-2 space-y-8">

      {/* -------- Header (Matches OrderDetails Layout) -------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-xs">

        {/* Left: Invoice Info */}
        <div className="space-y-1">
          <h2 className="font-semibold text-sm">Invoice Details</h2>

          <p>
            <span className="font-medium inline-block w-60">Invoice No:</span>
            {invoice.invoiceNo}
          </p>

          <p>
            <span className="font-medium inline-block w-60">PO No:</span>
            {invoice.poNo}
          </p>

          <p>
            <span className="font-medium inline-block w-60">Invoice Date:</span>
            {invoice.postingDate}
          </p>

          <p>
            <span className="font-medium inline-block w-60">Due Date:</span>
            {invoice.dueDate}
          </p>

          <p className="flex items-center">
            <span className="font-medium inline-block w-60">Status:</span>
            <StatusBadge status={invoice.status} />
          </p>
        </div>

        {/* Right: Bill To + Ship To */}
        <div className="flex justify-end gap-10">
          <div className="w-60">
            <h2 className="font-semibold text-sm mb-1">Bill To</h2>
            <p className="text-xs whitespace-pre-line">{billToFull}</p>
          </div>

          <div className="w-60">
            <h2 className="font-semibold text-sm mb-1">Ship To</h2>
            <p className="text-xs whitespace-pre-line">{shipToFull}</p>
          </div>
        </div>

      </div>

      {/* -------- Items Table -------- */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse mt-4 text-xs border-b border-gray-300">
          <thead>
            <tr className="text-left border-b border-gray-300">
              <th>No.</th>
              <th>Item Code</th>
              <th>Description</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>

          <tbody>
            {invoice.items?.map((item) => (
              <tr key={item.no} className="text-xs">
                <td>{item.no}</td>
                <td>{item.itemCode}</td>
                <td>{item.itemName}</td>
                <td>{item.qty}</td>
                <td>
                  {invoice.currency} {item.price.toFixed(2)}
                </td>
                <td>
                  {invoice.currency} {(item.qty * item.price).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* -------- Totals -------- */}
      <div className="max-w-sm ml-auto text-xs">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{invoice.currency} {subtotal.toFixed(2)}</span>
        </div>

        <div className="flex justify-between mt-1">
          <span>Discount:</span>
          <span>- {invoice.currency} {invoice.discount.toFixed(2)}</span>
        </div>

        <div className="flex justify-between mt-1">
          <span>VAT:</span>
          <span>+ {invoice.currency} {invoice.vat.toFixed(2)}</span>
        </div>

        <div className="flex justify-between font-semibold text-gray-800 border-t border-gray-300 pt-2 mt-2">
          <span>Final Amount:</span>
          <span>{invoice.currency} {finalTotal.toFixed(2)}</span>
        </div>
      </div>

    </div>
  );
}

export default InvoiceDetails;
