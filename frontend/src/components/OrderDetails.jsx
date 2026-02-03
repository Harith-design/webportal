import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import axios from "axios";
import { PackageOpen, Truck, FileBox, UserRound, Boxes, CircleStar } from "lucide-react";

const statusConfig = {
  Open: {
    label: "Open",
    icon: <PackageOpen size={16} className="mr-1" />,
    style: {
      background: "radial-gradient(circle at 20% 80%, #b2faffff, #afc9ffff)",
      color: "#007edf",
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

  const type = searchParams.get("type") || "sales";
  const docEntryFromQuery = searchParams.get("de");
  const apiUrl = process.env.REACT_APP_BACKEND_API_URL;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editableItems, setEditableItems] = useState([]);

  const [bpAddresses, setBpAddresses] = useState({ shipTo: [], billTo: [], defaults: {} });
  const [shipToFull, setShipToFull] = useState("");
  const [billToFull, setBillToFull] = useState("");

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

  const fetchBpAddresses = async (cardCode, token) => {
    try {
      const res = await axios.get(
        `${apiUrl}/api/sap/business-partners/${encodeURIComponent(cardCode)}/addresses`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.status === "success") {
        const { shipTo, billTo, defaults } = res.data;
        const pack = { shipTo: shipTo || [], billTo: billTo || [], defaults: defaults || {} };
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

  useEffect(() => {
    if (!order) return;

    let initialItems = [];

    if (type === "invoice" && Array.isArray(order.DocumentLines)) {
      initialItems = order.DocumentLines.map((line, index) => ({
        no: index + 1,
        itemCode: line.ItemCode || "-",
        itemName: line.ItemDescription || line.Text || "-",
        qty: Number(line.Quantity ?? 0),
        price: Number(line.UnitPrice ?? line.Price ?? 0),
        priceInput: line.UnitPrice != null || line.Price != null ? String(line.UnitPrice ?? line.Price) : "",
        weight: Number(line.U_Weight ?? 0),
      }));
    } else if (Array.isArray(order.Lines)) {
      initialItems = order.Lines.map((line, index) => ({
        no: index + 1,
        itemCode: line.ItemCode || "-",
        itemName: line.ItemName || line.Description || "-",
        qty: Number(line.Quantity ?? 0),
        price: Number(line.UnitPrice ?? line.Price ?? 0),
        priceInput: line.UnitPrice != null || line.Price != null ? String(line.UnitPrice ?? line.Price) : "",
        weight: Number(line.U_Weight ?? 0),
      }));
    }

    if (initialItems.length === 0) {
      initialItems = [
        {
          no: 1,
          itemCode: "-",
          itemName: "Item details not available",
          qty: 1,
          price: Number(order.DocTotal || order.total || 0),
          weight: 0,
        },
      ];
    }

    setEditableItems(initialItems);
  }, [order, type]);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);

        const userStr =
          localStorage.getItem("user") || sessionStorage.getItem("user");
        const userModel = JSON.parse(userStr || "{}");
        const token =
          localStorage.getItem("token") || sessionStorage.getItem("token");
        const headers = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

        if (!userModel.cardcode) {
          setError("User company not found.");
          return;
        }

        let headerLike = {};
        let fullOrder = null;

        if (type === "invoice") {
          const res = await axios.get(`${apiUrl}/api/sap/invoices/${id}/details`, headers);
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
          const docEntry = docEntryFromQuery || id;
          if (!docEntry) {
            setError("Missing sales order DocEntry.");
            return;
          }
          const res = await axios.get(`${apiUrl}/api/sap/orders/${docEntry}`, headers);
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

  const orderDateDisplay =
    order.orderDate || order.postingDate || (order.DocDate ? order.DocDate.substring(0, 10) : "-");

  const dueDateDisplay = order.dueDate || (order.DocDueDate ? order.DocDueDate.substring(0, 10) : "-");

  const salesNoDisplay = order.DocNum || order.salesNo || "-";
  const invoiceNoDisplay = order.DocNum || order.invoiceNo || "-";

  const handlePriceChange = (index, newPrice) => {
    setEditableItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, price: parseFloat(newPrice) || 0, priceInput: newPrice } : item
      )
    );
  };

  const subtotal = editableItems.reduce((sum, item) => sum + item.qty * item.price, 0);
  const discount = Number(order?.discount || 0);
  const vat = Number(order?.vat || 0);
  const finalTotal = subtotal - discount + vat;

  return (
    <div className="h-full py-6 px-4 md:px-8 lg:px-28 space-y-6">
      {/* Title */}
      <div
        className="flex flex-col items-center p-3 gap-2 border border-gray-300 rounded-lg"
        style={{ background: "radial-gradient(circle at 10% 60%, #ffeeee, #a8c5fe)" }}
      >
        <h2 className="font-semibold text-lg">Orders Pending Pricing</h2>
        <p className="text-xs">
          Review the orders below and enter the unit price for each item.
        </p>
      </div>

      {/* Order Details */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <FileBox size={20} />
          <h2 className="font-semibold text-lg">Order Details</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs border bg-white p-4 md:p-5 rounded-lg">
          <div className="flex flex-col gap-1">
            <span className="font-semibold">{type === "invoice" ? "Invoice No:" : "Sales No:"}</span>
            {type === "invoice" ? invoiceNoDisplay : salesNoDisplay}
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-semibold">PO No:</span>
            {order.NumAtCard || order.poNo || "-"}
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-semibold">{type === "invoice" ? "Invoice Date:" : "Order Date:"}</span>
            {orderDateDisplay}
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-semibold">Due Date:</span>
            {dueDateDisplay}
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-semibold">Status:</span>
            <div className="inline-block">
              <StatusBadge status={statusText} />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-semibold">Sales Employee:</span>
            {order.CardName || order.Customer || "-"}
          </div>
        </div>
      </div>

      {/* Customer Details */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <UserRound size={20} />
          <h2 className="font-semibold text-lg">Customer Details</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs border bg-white p-4 md:p-5 rounded-lg">
          <div className="flex flex-col gap-1">
            <span className="font-semibold">Customer:</span>
            {order.CardName || order.Customer || "-"}
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-semibold">Customer Representative:</span>
            {order.CardName || order.Customer || "-"}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Boxes size={20} />
          <h2 className="font-semibold text-lg">Orders</h2>
        </div>
        <div className="flex-1 flex flex-col space-y-6">
          <div className="overflow-x-auto border rounded-lg bg-white p-2 w-full">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="text-left px-4 py-2 border-b">
                  <th>#</th>
                  <th>Item</th>
                  <th>Description</th>
                  <th className="text-center">Quantity</th>
                  <th className="text-center">Weight</th>
                  <th className="text-center">Unit Price</th>
                  <th className="text-center">Total Weight</th>
                  <th className="text-center">Total Price</th>
                </tr>
              </thead>
              <tbody>
                {editableItems.map((item, index) => (
                  <tr key={item.no} className="text-xs">
                    <td className="px-4 py-2">{item.no}</td>
                    <td className="px-4 py-2">{item.itemCode}</td>
                    <td className="px-4 py-2">{item.itemName}</td>
                    <td className="px-4 py-2 text-center">{item.qty}</td>
                    <td className="px-4 py-2 text-center">{item.weight ? item.weight.toFixed(2) : "0.00"}</td>
                    <td className="px-4 py-2 text-center">
                      {currency}{" "}
                      <input
                        type="text"
                        value={item.priceInput}
                        placeholder="0.00"
                        onChange={(e) => handlePriceChange(index, e.target.value)}
                        className="w-20 text-center border rounded px-1 py-0.5"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">{item.weight ? item.weight.toFixed(2) : "0.00"}</td>
                    <td className="px-4 py-2 text-center">
                      {currency} {(item.qty * item.price).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals + Approve button */}
          <div className="flex flex-col space-y-4">
            <div className="text-sm space-y-1 p-5 rounded-lg border bg-white w-full">
              <div className="flex justify-between"><span>Subtotal:</span><span>{currency} {subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Discount:</span><span>- {currency} {discount.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>VAT:</span><span>+ {currency} {vat.toFixed(2)}</span></div>
              <div className="flex justify-between font-semibold border-t border-gray-600 pt-2 mt-2">
                <span>Final Amount:</span>
                <span>{currency} {finalTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="w-full">
              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 bg-black text-white text-xs font-semibold py-2 px-4 rounded-xl hover:bg-gray-300 hover:text-black transition"
                onClick={() => console.log("Approved!")}
              >
                <CircleStar size={16} />
                Approve
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetails;
