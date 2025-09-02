import React from "react";
import { useParams } from "react-router-dom";

function OrderDetails() {
  const { id } = useParams();

  // Dummy data
  const orders = [
    {
      id: 1001,
      ponum: "PO-12345",
      orderDate: "25-08-2025",
      dueDate: "30-08-2025",
      total: 1200,
      currency: "RM",
      status: "Open",
      billTo: "ABC Headquarters, KL",
      shipTo: "Warehouse A, Selangor",
      items: [
        { no: 1, name: "Item A", desc: "Description for Item A", qty: 2, price: 200 },
        { no: 2, name: "Item B", desc: "Description for Item B", qty: 3, price: 150 },
      ],
      discount: 50,
      vat: 60,
    },
    {
      id: 1002,
      ponum: "PO-67890",
      orderDate: "24-08-2025",
      dueDate: "29-08-2025",
      total: 800,
      currency: "RM",
      status: "Delivered",
      billTo: "XYZ Corp, Penang",
      shipTo: "Port Klang, Selangor",
      items: [
        { no: 1, name: "Item C", desc: "Description for Item C", qty: 1, price: 400 },
        { no: 2, name: "Item D", desc: "Description for Item D", qty: 2, price: 200 },
      ],
      discount: 20,
      vat: 40,
    },
  ];

  const order = orders.find((o) => o.id === parseInt(id));

  if (!order) {
    return <p className="p-6 text-red-600">Order not found</p>;
  }

  // Calculate subtotal
  const subtotal = order.items.reduce((sum, item) => sum + item.qty * item.price, 0);
  const finalTotal = subtotal - order.discount + order.vat;

  return (
    <div className="p-6 space-y-8 bg-white rounded-xl shadow-md">
      {/* Section 1: Sales Order Number */}
      {/* <div>
        <h2 className="text-2xl font-bold">Sales Order #{order.id}</h2>
      </div> */}

      {/* Section 2: Order Info, Bill To, Ship To */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
        <div className="space-y-1">
          <p><span className="font-semibold">SO Number:</span> {order.id}</p>
          <p><span className="font-semibold">PO Number:</span> {order.ponum}</p>
          <p><span className="font-semibold">Order Date:</span> {order.orderDate}</p>
          <p><span className="font-semibold">Status:</span>
            <span className={`ml-1 px-2 py-0.5 rounded text-xs ${
              order.status === "Delivered" ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"
            }`}>
              {order.status}
            </span>
          </p>
        </div>
        <div className="flex justify-end">
          <div className="text-left">
            <h3 className="font-semibold text-sm">Bill To</h3>
            <p className="text-xs">{order.billTo}</p>
          </div>
        </div>

        <div className="flex justify-end ">
          <div className="text-left pr-6">
              <h3 className="font-semibold text-sm">Ship To</h3>
              <p className="text-xs">{order.shipTo}</p>
          </div>
        </div>
      </div>

      {/* Section 3: Order Items Table */}
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
            {order.items.map((item) => (
              <tr className="text-xs" key={item.no}>
                <td className="border px-4 py-2 text-center">{item.no}</td>
                <td className="border px-4 py-2">{item.name}</td>
                <td className="border px-4 py-2">{item.desc}</td>
                <td className="border px-4 py-2 text-center">{item.qty}</td>
                <td className="border px-4 py-2 text-center">{order.currency} {item.price}</td>
                <td className="border px-4 py-2 text-center">{order.currency} {item.qty * item.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Section 4: Totals */}
      <div className="max-w-sm ml-auto text-sm space-y-1">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{order.currency} {subtotal}</span>
        </div>
        <div className="flex justify-between">
          <span>Discount:</span>
          <span>- {order.currency} {order.discount}</span>
        </div>
        <div className="flex justify-between">
          <span>VAT:</span>
          <span>+ {order.currency} {order.vat}</span>
        </div>
        <div className="flex justify-between font-semibold text-gray-800 border-t pt-2">
          <span>Final Amount:</span>
          <span>{order.currency} {finalTotal}</span>
        </div>
      </div>

      {/* Section 5: Final Amount */}
      {/* <div className="p-6 max-w-md ml-auto">
        <h3 className="text-xs flex justify-between">
          <span>Final Amount:</span>
          <span>{order.currency} {finalTotal}</span>
        </h3>
      </div> */}
    </div>
  );
}

export default OrderDetails;
