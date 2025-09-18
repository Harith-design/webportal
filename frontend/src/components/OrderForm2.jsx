import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import "./OrderForm.css"; // your custom styles if needed

function PlaceOrderPage() {
  const [order, setOrder] = useState({
    ponum: "",
    deliveryDate: "",
    billingAddress: "",
    shippingAddress: "",
  });

  const [rows, setRows] = useState([
    { itemNo: "1001", description: "Sample Item", qty: 1, price: 100, weight: 2 },
  ]);

  return (
    <div className="bg-yellow-200 min-h-screen w-full p-6">
      {/* Blue header area */}
      <div className="bg-blue-200 rounded-xl shadow-md p-6 mb-6 max-w-6xl mx-auto">
        <h1 className="text-xl font-bold mb-4">Place an Order</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <input
            type="text"
            placeholder="PO Number"
            value={order.ponum}
            onChange={(e) => setOrder({ ...order, ponum: e.target.value })}
            className="border rounded-md px-3 py-2"
          />
          <input
            type="date"
            placeholder="Delivery Date"
            value={order.deliveryDate}
            onChange={(e) => setOrder({ ...order, deliveryDate: e.target.value })}
            className="border rounded-md px-3 py-2"
          />
          <input
            type="text"
            placeholder="Billing Address"
            value={order.billingAddress}
            onChange={(e) => setOrder({ ...order, billingAddress: e.target.value })}
            className="border rounded-md px-3 py-2"
          />
          <input
            type="text"
            placeholder="Shipping Address"
            value={order.shippingAddress}
            onChange={(e) => setOrder({ ...order, shippingAddress: e.target.value })}
            className="border rounded-md px-3 py-2"
          />
        </div>
      </div>

      {/* Red scrollable table area */}
      <div className="bg-red-200 rounded-xl shadow-md p-4 overflow-x-auto max-w-6xl mx-auto">
        <div className="min-w-[1200px]">
          <table className="table-auto border-collapse w-full bg-white">
            <thead>
              <tr className="text-xs font-semibold border-b text-center align-middle">
                <th className="px-4 py-2 text-left min-w-[180px]">Item No.</th>
                <th className="px-4 py-2 text-left min-w-[220px]">Item Description</th>
                <th className="px-4 py-2 min-w-[120px]">Quantity</th>
                <th className="px-4 py-2 min-w-[120px]">Unit Price</th>
                <th className="px-4 py-2 min-w-[120px]">Weight</th>
                <th className="px-4 py-2 min-w-[120px]">Total Weight</th>
                <th className="px-4 py-2 min-w-[120px]">Line Total</th>
                <th className="px-4 py-2 min-w-[120px]">Tax Code</th>
                <th className="px-4 py-2 min-w-[120px]">Delete</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {rows.map((row, idx) => (
                <tr key={idx} className="border-b">
                  <td className="px-4 py-2">{row.itemNo}</td>
                  <td className="px-4 py-2">{row.description}</td>
                  <td className="px-4 py-2">{row.qty}</td>
                  <td className="px-4 py-2">{row.price}</td>
                  <td className="px-4 py-2">{row.weight}</td>
                  <td className="px-4 py-2">{row.qty * row.weight}</td>
                  <td className="px-4 py-2">{row.qty * row.price}</td>
                  <td className="px-4 py-2">SR</td>
                  <td className="px-4 py-2 text-center">
                    <button className="text-red-500 hover:text-red-700">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PlaceOrderPage;
