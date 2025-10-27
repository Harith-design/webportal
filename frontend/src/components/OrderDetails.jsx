import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import axios from "axios";

function OrderDetails() {
  const { id } = useParams();
  const location = useLocation();
  const type = new URLSearchParams(location.search).get("type") || "sales"; // default to sales

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        let user = localStorage.getItem("user") || sessionStorage.getItem("user");
        const userModel = JSON.parse(user);

        let endpoint = "";
        if (type === "invoice") {
          endpoint = `http://127.0.0.1:8000/api/sap/invoices/${id}`;
        } else {
          // 🔹 Get full list of sales orders like before
          endpoint = `http://127.0.0.1:8000/api/sap/orders`;
        }

        const res = await axios.get(endpoint);

        if (res.data && res.data.data) {
          let found;

          if (type === "invoice") {
            // Invoice API already returns single object
            found = res.data.data;
          } else {
            // Sales Order API returns array — find the matching one
            found = res.data.data.find(
              (o) =>
                o.salesNo.toString() === id.toString() &&
                o.customerCode === userModel.cardcode
            );
          }

          if (found) {
            setOrder(found);
          } else {
            setError(
              `${type === "invoice" ? "Invoice" : "Sales Order"} not found or does not belong to your company.`
            );
          }
        } else {
          setError(`No ${type} data received from SAP API.`);
        }
      } catch (err) {
        console.error("Error fetching order:", err);
        setError(`Failed to load ${type} details.`);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, type]);

  if (loading) return <p className="p-6 text-gray-500">Loading {type} details...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;
  if (!order) return <p className="p-6 text-gray-500">No {type} found.</p>;

  // Map items
  const items =
    order.items && order.items.length
      ? order.items.map((item, index) => ({
          no: index + 1,
          itemCode: item.itemCode || "-",
          itemName: item.itemName || "-",
          qty: item.quantity || 0,
          price: item.price || 0,
        }))
      : [
          {
            no: 1,
            itemCode: "-",
            itemName: "Item details not available",
            qty: 1,
            price: order.total || 0,
          },
        ];

  const subtotal = items.reduce((sum, item) => sum + item.qty * item.price, 0);
  const discount = order.discount || 0;
  const vat = order.vat || 0;
  const finalTotal = subtotal - discount + vat;

  return (
    <div className="p-6 space-y-8 bg-white rounded-xl shadow-md">
      {/* Order Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
        <div className="space-y-1">
          <p>
            <span className="font-semibold">{type === "invoice" ? "Invoice No:" : "Sales No:"}</span>{" "}
            {type === "invoice" ? order.invoiceNo : order.salesNo}
          </p>
          <p>
            <span className="font-semibold">PO No:</span> {order.poNo || "-"}
          </p>
          <p>
            <span className="font-semibold">{type === "invoice" ? "Invoice Date:" : "Order Date:"}</span>{" "}
            {order.orderDate || order.postingDate || "-"}
          </p>
          <p>
            <span className="font-semibold">Due Date:</span> {order.dueDate || "-"}
          </p>
          <p>
            <span className="font-semibold">Status:</span>{" "}
            <span
              className={`ml-1 px-2 py-0.5 rounded text-xs ${
                order.status === "Delivered"
                  ? "bg-green-100 text-green-600"
                  : "bg-yellow-100 text-yellow-600"
              }`}
            >
              {order.status}
            </span>
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-sm">Bill To</h3>
          <p className="text-xs">{order.billTo || "-"}</p>
        </div>

        <div>
          <h3 className="font-semibold text-sm">Ship To</h3>
          <p className="text-xs">{order.shipTo || "-"}</p>
        </div>
      </div>

      {/* Items Table */}
      <div className="p-4 overflow-x-auto">
        <table className="min-w-full border-collapse mt-4 text-xs">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-4 py-2">No.</th>
              <th className="border px-4 py-2">Item Code</th>
              <th className="border px-4 py-2">Description</th>
              <th className="border px-4 py-2">Qty</th>
              <th className="border px-4 py-2">Price</th>
              <th className="border px-4 py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.no} className="text-xs">
                <td className="border px-4 py-2 text-center">{item.no}</td>
                <td className="border px-4 py-2">{item.itemCode}</td>
                <td className="border px-4 py-2">{item.itemName}</td>
                <td className="border px-4 py-2 text-center">{item.qty}</td>
                <td className="border px-4 py-2 text-right">
                  {order.currency} {item.price.toFixed(2)}
                </td>
                <td className="border px-4 py-2 text-right">
                  {order.currency} {(item.qty * item.price).toFixed(2)}
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
            {order.currency} {subtotal.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Discount:</span>
          <span>
            - {order.currency} {discount.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>VAT:</span>
          <span>
            + {order.currency} {vat.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between font-semibold text-gray-800 border-t pt-2">
          <span>Final Amount:</span>
          <span>
            {order.currency} {finalTotal.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default OrderDetails;
