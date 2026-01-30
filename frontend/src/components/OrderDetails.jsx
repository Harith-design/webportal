import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import axios from "axios";
import { PackageOpen, Truck} from "lucide-react";

const statusConfig = {
  Open: {
    label: "Open",
    icon: <PackageOpen size={16} className="mr-1" />,
    style: {
    background: "black",
    color: "white",
    padding: "0.5rem 1rem", // equivalent to px-4 py-2
    borderRadius: "1rem", // equivalent to rounded-2xl
    },
  },
  Closed: {
    label: "Delivered",
    icon: <Truck size={16} className="mr-1" />,
    style: {
      background: "radial-gradient(circle at 20% 80%, #c9ffa4ff, #89fdbdff)",
      color: "#16aa3dff",
    },
  },
};

const StatusBadge = ({ status }) => {
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

function OrderDetails() {
  const { id } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const type = searchParams.get("type") || "sales"; // "sales" or "invoice"
  const docEntryFromQuery = searchParams.get("de"); // for sales
  const apiUrl = process.env.REACT_APP_BACKEND_API_URL;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Address state (same approach as OrderForm.jsx)
    const [bpAddresses, setBpAddresses] = useState({ 
      shipTo: [], 
      billTo: [], 
      defaults: {} 
    });
    const [shipToFull, setShipToFull] = useState("");
    const [billToFull, setBillToFull] = useState("");
  
    // add labelOverride: if provided, it replaces the first line (AddressName)
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
  
    // Fetch BP addresses for the current user company
    const fetchBpAddresses = async (cardCode, token) => {
      try {
        const res = await axios.get(
          `${apiUrl}/api/sap/business-partners/${encodeURIComponent(cardCode)}/addresses`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data?.status === "success") {
          const { shipTo, billTo, defaults } = res.data;
          const pack = { 
            shipTo: shipTo || [], 
            billTo: billTo || [], 
            defaults: defaults || {} 
          };
          setBpAddresses(pack);
          return pack;
        }
      } catch (e) {
        console.error("Failed to fetch BP addresses:", e);
      }
      const pack = { shipTo: [], billTo: [], defaults: {} };
      setBpAddresses(pack);
      return pack;
    };
  
    // Resolve and set full address text for preview (with label override)
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
  
      // Force the displayed header line, data stays the same
      setShipToFull(formatAddress(shipObj, "Ship To"));
      setBillToFull(formatAddress(billObj, "Bill To"));
    };

    useEffect(() => {
      const fetchOrder = async () => {
            try {
              setLoading(true);
      
              const userStr =
                localStorage.getItem("user") || sessionStorage.getItem("user");
              const userModel = JSON.parse(userStr || "{}");
              const token =
                localStorage.getItem("token") || sessionStorage.getItem("token");
              const headers = token
                ? { headers: { Authorization: `Bearer ${token}` } }
                : {};
      
              if (!userModel.cardcode) {
                setError("User company not found.");
                return;
              }
      
              let headerLike = {};
              let fullOrder = null;
      
              if (type === "invoice") {
                // ------------ INVOICE DETAILS ------------
                const res = await axios.get(
                  `${apiUrl}/api/sap/invoices/${id}/details`,
                  headers
                );
                if (!res.data || !res.data.data) {
                  setError("No invoice data received from SAP API.");
                  return;
                }
                fullOrder = res.data.data;
      
                headerLike = {
                  shipTo: fullOrder.ShipToCode,
                  billTo: fullOrder.PayToCode,
                };
              } else {
                // ------------ SALES ORDER DETAILS ------------
                const docEntry = docEntryFromQuery || id; // prefer ?de=, fallback id
                if (!docEntry) {
                  setError("Missing sales order DocEntry.");
                  return;
                }
      
                const res = await axios.get(
                  `${apiUrl}/api/sap/orders/${docEntry}`,
                  headers
                );
                if (!res.data || !res.data.data) {
                  setError("No sales order data received from SAP API.");
                  return;
                }
      
                fullOrder = res.data.data;
      
                headerLike = {
                  shipTo: fullOrder.ShipToCode,
                  billTo: fullOrder.PayToCode,
                };
              }
      
              setOrder(fullOrder);
      
              const bpAddr = await fetchBpAddresses(userModel.cardcode, token);
              setResolvedAddresses(headerLike, bpAddr);
            } catch (err) {
              console.error("Error fetching order:", err);
              setError(`Failed to load ${type} details.`);
            } finally {
              setLoading(false);
            }
          };
      
          fetchOrder();
        }, [id, type, apiUrl, docEntryFromQuery]);

  if (loading) return <p className="p-6 text-gray-500">Loading {type} details...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;
  if (!order) return <p className="p-6 text-gray-500">No {type} found.</p>;

  const currency = order.DocCurrency || order.currency || "MYR";

  const statusText =
    order.DocumentStatus === "bost_Open" || order.status === "Open"
      ? "Open"
      : order.status || "Closed";

  const statusStyle = statusConfig[statusText] || statusConfig.Open;

  const orderDateDisplay =
    order.orderDate ||
    order.postingDate ||
    (order.DocDate ? order.DocDate.substring(0, 10) : "-");

  const dueDateDisplay =
    order.dueDate ||
    (order.DocDueDate ? order.DocDueDate.substring(0, 10) : "-");

  const salesNoDisplay = order.DocNum || order.salesNo || "-";
  const invoiceNoDisplay = order.DocNum || order.invoiceNo || "-";

  // ---------- Items ----------
  let rawItems = [];

  if (type === "invoice" && Array.isArray(order.DocumentLines)) {
    rawItems = order.DocumentLines.map((line, index) => ({
      no: index + 1,
      itemCode: line.ItemCode || "-",
      itemName: line.ItemDescription || line.Text || "-",
      qty: Number(line.Quantity ?? 0),
      price: Number(line.UnitPrice ?? line.Price ?? 0),
    }));
  } else if (Array.isArray(order.Lines) && order.Lines.length) {
    rawItems = order.Lines.map((line, index) => ({
      no: index + 1,
      itemCode: line.ItemCode || "-",
      itemName: line.ItemName || line.Description || "-",
      qty: Number(line.Quantity ?? 0),
      price: Number(line.UnitPrice ?? line.Price ?? 0),
    }));
  } else if (Array.isArray(order.DocumentLines) && order.DocumentLines.length) {
    // in case backend only sends raw DocumentLines
    rawItems = order.DocumentLines.map((line, index) => ({
      no: index + 1,
      itemCode: line.ItemCode || "-",
      itemName: line.ItemDescription || line.Text || "-",
      qty: Number(line.Quantity ?? 0),
      price: Number(line.UnitPrice ?? line.Price ?? 0),
    }));
  }

  const items =
    rawItems && rawItems.length
      ? rawItems
      : [
          {
            no: 1,
            itemCode: "-",
            itemName: "Item details not available",
            qty: 1,
            price: Number(order.DocTotal || order.total || 0),
          },
        ];

  const subtotal = items.reduce((sum, item) => sum + item.qty * item.price, 0);
  const discount = Number(order.discount || 0);
  const vat = Number(order.vat || 0);
  const finalTotal = subtotal - discount + vat;

  return (
  <div className="h-screen bg-white">
    {/* ---------- LEFT SIDE: Order & Customer Details ---------- */}
    <div className="bg-white">
        {/* Order Details */}
        <div className="px-5 py-2" style={{background: "radial-gradient(circle at 10% 60%, #ffeeee, #a8c5fe)"}}>
          {/* <h2 className="font-semibold text-2xl mb-2">Order Details</h2> */}
          <div className="flex flex-row justify-between text-xs items-center tracking-[2px]" >
            <div className="flex  gap-2">
              <span className="font-semibold">{type === "invoice" ? "Invoice No:" : "SALES NO"}</span>
              {type === "invoice" ? invoiceNoDisplay : salesNoDisplay}
            </div>
            <div className="flex gap-2">
              <span className="font-semibold">CUSTOMER</span>
              <span>{order.CardName || order.Customer || "-"}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold gap-2 ">PO NO</span>
              {order.NumAtCard || order.poNo || "-"}
            </div>
            <div className="flex gap-2">
              <span className="font-semibold">{type === "invoice" ? "Invoice Date:" : "ORDER DATE"}</span>
              {orderDateDisplay}
            </div>
            <div className="flex gap-2">
              <span className="font-semibold">DUE DATE</span>
              {dueDateDisplay}
            </div>
            <div className="flex gap-2 items-center">
              <span className="font-semibold">STATUS</span>
              <StatusBadge status={statusText} />
            </div>
        
          </div>
        </div>
    </div>


    {/* ---------- RIGHT SIDE: Items Table + Totals ---------- */}
    <div className="flex-1 flex flex-col space-y-6 p-4 ">
      
      {/* Items Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-xs border-b-2 border-black">
          <thead>
            <tr className="text-left px-4 py-2 border-b-2 border-black">
              <th>#</th>
              <th>Item Code</th>
              <th>Description</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.no} className="text-xs">
                <td className="px-4 py-2">{item.no}</td>
                <td className="px-4 py-2">{item.itemCode}</td>
                <td className="px-4 py-2">{item.itemName}</td>
                <td className="px-4 py-2">{item.qty}</td>
                <td className="px-4 py-2">
                  {currency} {item.price.toFixed(2)}
                </td>
                <td className="px-4 py-2">
                  {currency} {(item.qty * item.price).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="max-w-sm w-full ml-auto text-xs space-y-1">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{currency} {subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Discount:</span>
          <span>- {currency} {discount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>VAT:</span>
          <span>+ {currency} {vat.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-semibold text-gray-800 border-t border-gray-300 pt-2 mt-2">
          <span>Final Amount:</span>
          <span>{currency} {finalTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  </div>
);


}

export default OrderDetails;
