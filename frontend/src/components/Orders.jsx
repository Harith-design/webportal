import React from "react";
import { Package, Truck, Clock} from "lucide-react";
import { Link } from "react-router-dom"; // import Link

function OrdersPage() {
  const orders = [
    {
      id: 1001,
      poNo: "PO-2025-001",
      customer: "ABC Trading",
      billTo: "ABC Trading HQ, KL",
      shipTo: "ABC Trading Warehouse, Penang",
      orderDate: "25-08-2025",
      dueDate: "30-08-2025",
      total: 1200,
      currency: "RM",
      status: "Open",
    },
    {
      id: 1002,
      poNo: "PO-2025-002",
      customer: "XYZ Supplies",
      billTo: "XYZ Supplies HQ, JB",
      shipTo: "XYZ Supplies Warehouse, Melaka",
      orderDate: "24-08-2025",
      dueDate: "29-08-2025",
      total: 800,
      currency: "RM",
      status: "Delivered",
    },
    {
      id: 1003,
      poNo: "PO-2025-003",
      customer: "Global Parts",
      billTo: "Global Parts HQ, Selangor",
      shipTo: "Global Parts Logistic Hub, Johor",
      orderDate: "23-08-2025",
      dueDate: "28-08-2025",
      total: 500,
      currency: "RM",
      status: "In Transit",
    },
    {
      id: 1004,
      poNo: "PO-2025-004",
      customer: "BestMart",
      billTo: "BestMart HQ, KL",
      shipTo: "BestMart Outlet, Ipoh",
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
            <tr className="text-center text-sm text-gray-500 border-b">
              <th className="px-4 py-2 font-normal">Sales No.</th>
              <th className="px-4 py-2 font-normal">PO No.</th>
              <th className="px-4 py-2 font-normal">Order Date</th>
              <th className="px-4 py-2 font-normal">Due Date</th>
              <th className="px-4 py-2 font-normal">Total</th>
              <th className="px-4 py-2 font-normal">Currency</th>
              <th className="px-4 py-2 font-normal">Status</th>
              <th className="px-4 py-2 font-normal">Download</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {orders.map((order) => (
              <tr key={order.id} className="even:bg-gray-50 text-center">
                <td className="px-4 py-2 text-blue-600 hover:underline">
                  {/* Make Sales No. a link */}
                  <Link to={`/orders/${order.id}`}>{order.id}</Link>
                </td>
                <td className="px-4 py-2">{order.poNo}</td>
                <td className="px-4 py-2">{order.orderDate}</td>
                <td className="px-4 py-2">{order.dueDate}</td>
                <td className="px-4 py-2">{order.total}</td>
                <td className="px-4 py-2">{order.currency}</td>
                <td className="px-4 py-2">{renderStatus(order.status)}</td>
                <td className="px-4 py-2 flex justify-center">
                 <a 
                    href="/path/to/file.pdf" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/8/87/PDF_file_icon.svg" 
                      alt="PDF" 
                      className="w-5 h-5" 
                    />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default OrdersPage;
