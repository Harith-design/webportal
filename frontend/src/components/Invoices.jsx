import React from "react";
import { Package, Truck, Clock } from "lucide-react";

function InvoicesPage() {
  const orders = [
    {
      id: 1001,
      ponum: "ABC Trading",
      orderDate: "25-08-2025",
      dueDate: "30-08-2025",
      total: 1200,
      currency: "RM",
      status: "Open",
    },
    {
      id: 1002,
      ponum: "XYZ Supplies",
      orderDate: "24-08-2025",
      dueDate: "29-08-2025",
      total: 800,
      currency: "RM",
      status: "Delivered",
    },
    {
      id: 1003,
      ponum: "Global Parts",
      orderDate: "23-08-2025",
      dueDate: "28-08-2025",
      total: 500,
      currency: "RM",
      status: "In Transit",
    },
    {
      id: 1004,
      ponum: "BestMart",
      orderDate: "22-08-2025",
      dueDate: "27-08-2025",
      total: 1500,
      currency: "RM",
      status: "Open",
    },
  ];

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

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-md overflow-x-auto">
        <table className="table-auto w-full border-collapse">
          <thead>
            <tr className="text-left text-sm text-gray-500 border-b">
              <th className="px-4 py-2 font-normal">Invoice No.</th>
              <th className="px-4 py-2 font-normal">PO No.</th>
              <th className="px-4 py-2 font-normal">Posting Date</th>
              <th className="px-4 py-2 font-normal">Due Date</th>
              <th className="px-4 py-2 font-normal">Total</th>
              <th className="px-4 py-2 font-normal">Currency</th>
              <th className="px-4 py-2 font-normal">Status</th>
              <th className="px-4 py-2 font-normal">Download</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {orders.map((order) => (
              <tr key={order.id} className="bg-white even:bg-gray-50">
                <td className="px-4 py-2">{order.id}</td>
                <td className="px-4 py-2">{order.ponum}</td>
                <td className="px-4 py-2">{order.orderDate}</td>
                <td className="px-4 py-2">{order.dueDate}</td>
                <td className="px-4 py-2">{order.total}</td>
                <td className="px-4 py-2">{order.currency}</td>
                <td className="px-4 py-2">{renderStatus(order.status)}</td>
                <td className="px-4 py-2">
                  <button className="text-blue-600 hover:underline">Download</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default InvoicesPage;
