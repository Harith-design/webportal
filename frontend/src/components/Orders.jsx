import React, { useState } from "react";
import { Package, Truck, Clock, Search, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./DatePicker.css"; // <-- your overrides

function OrdersPage() {
  const orders = [
    {
      id: 1001,
      poNo: "PO-2025-001",
      customer: "ABC Trading",
      billTo: "ABC Trading HQ, KL",
      shipTo: "ABC Trading Warehouse, Penang",
      orderDate: "2025-08-25",
      dueDate: "2025-08-30",
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
      orderDate: "2025-08-24",
      dueDate: "2025-08-29",
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
      orderDate: "2025-08-23",
      dueDate: "2025-08-28",
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
      orderDate: "2025-08-22",
      dueDate: "2025-08-27",
      total: 1500,
      currency: "RM",
      status: "Open",
    },
  ];

  // 🔹 States for filters
  const [statusFilter, setStatusFilter] = useState("");
  const [orderStart, setOrderStart] = useState(null);
  const [orderEnd, setOrderEnd] = useState(null);
  const [dueStart, setDueStart] = useState(null);
  const [dueEnd, setDueEnd] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // 🔹 Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // 🔹 Filtering logic
  const filteredOrders = orders.filter((order) => {
    const orderDate = new Date(order.orderDate);
    const dueDate = new Date(order.dueDate);

    if (statusFilter && statusFilter !== "all" && order.status !== statusFilter) return false;
    if (orderStart && orderDate < orderStart) return false;
    if (orderEnd && orderDate > orderEnd) return false;
    if (dueStart && dueDate < dueStart) return false;
    if (dueEnd && dueDate > dueEnd) return false;

    if (
      searchQuery &&
      !(
        order.id.toString().includes(searchQuery) ||
        order.poNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    ) {
      return false;
    }
    return true;
  });

  // 🔹 Pagination logic
  const indexOfLastOrder = currentPage * rowsPerPage;
  const indexOfFirstOrder = indexOfLastOrder - rowsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / rowsPerPage));

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
    <div className="bg-white p-6 rounded-xl shadow-md overflow-x-auto space-y-6">
      {/* 🔹 Filters */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        {/* Left Filters */}
        <div className="flex flex-wrap gap-4">
          {/* Status Dropdown */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-lg px-2 py-1 text-xs text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[10%]"
            >
              <option value="all">All Status</option>
              <option value="Open">Open</option>
              <option value="Delivered">Delivered</option>
              <option value="In Transit">In Transit</option>
            </select>
          </div>

          {/* Order Dates */}
          <div className="flex items-center gap-2">
            <label className="text-xs">Order Date:</label>

            <div className="relative">
              <DatePicker
                selected={orderStart}
                onChange={(date) => setOrderStart(date)}
                placeholderText="From"
                className="border rounded-lg px-2 py-1 text-xs w-28 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[15%]"
              />
              <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
            </div>

            <div className="relative">
              <DatePicker
                selected={orderEnd}
                onChange={(date) => setOrderEnd(date)}
                placeholderText="To"
                className="border rounded-lg px-2 py-1 text-xs w-28 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[15%]"
              />
              <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
            </div>
          </div>

          {/* Due Dates */}
          <div className="flex items-center gap-2">
            <label className="text-xs">Due Date:</label>

            <div className="relative">
              <DatePicker
                selected={dueStart}
                onChange={(date) => setDueStart(date)}
                placeholderText="From"
                className="border rounded-lg px-2 py-1 text-xs w-28 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[15%]"
              />
              <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
            </div>

            <div className="relative">
              <DatePicker
                selected={dueEnd}
                onChange={(date) => setDueEnd(date)}
                placeholderText="To"
                className="border rounded-lg px-2 py-1 text-xs w-28 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[15%]"
              />
              <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
            </div>
          </div>
        </div>

        {/* Right Search Bar */}
        <div className="relative w-full md:w-64">
          <Search size={16} className="text-gray-500 absolute left-2 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8  py-1 text-xs border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-500"
          />
        </div>
      </div>

      {/* 🔹 Orders Table */}
      <div className="rounded-xl overflow-hidden shadow-sm min-h-[400px] max-h-[600px] overflow-y-auto">
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
            {currentOrders.length > 0 ? (
              currentOrders.map((order) => (
                <tr key={order.id} className="even:bg-gray-50 text-center">
                  <td className="px-4 py-2 text-blue-600 hover:underline">
                    <Link to={`/orders/${order.id}`}>{order.id}</Link>
                  </td>
                  <td className="px-4 py-2">{order.poNo}</td>
                  <td className="px-4 py-2">{order.orderDate}</td>
                  <td className="px-4 py-2">{order.dueDate}</td>
                  <td className="px-4 py-2">{order.total}</td>
                  <td className="px-4 py-2">{order.currency}</td>
                  <td className="px-4 py-2">{renderStatus(order.status)}</td>
                  <td className="px-4 py-2 flex justify-center">
                    <a href="/path/to/file.pdf" target="_blank" rel="noopener noreferrer">
                      <img
                        src="https://upload.wikimedia.org/wikipedia/commons/8/87/PDF_file_icon.svg"
                        alt="PDF"
                        className="w-5 h-5"
                      />
                    </a>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="text-center py-4 text-gray-500">
                  No matching orders found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
<div className="flex justify-center items-center gap-2 mt-4">
  {/* Prev button */}
  <button
    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
    disabled={currentPage === 1}
    className="px-3 py-1 border rounded text-xs disabled:opacity-50"
  >
    Prev
  </button>

  {/* Always show page 1 */}
  <button
    onClick={() => setCurrentPage(1)}
    className={`px-3 py-1 border rounded text-xs ${
      currentPage === 1 ? "bg-blue-500 text-white" : ""
    }`}
  >
    1
  </button>

  {/* Show page 2+ only if needed */}
  {totalPages > 1 &&
    Array.from({ length: totalPages - 1 }, (_, i) => (
      <button
        key={i + 2}
        onClick={() => setCurrentPage(i + 2)}
        className={`px-3 py-1 border rounded text-xs ${
          currentPage === i + 2 ? "bg-blue-500 text-white" : ""
        }`}
      >
        {i + 2}
      </button>
    ))}

  {/* Next button */}
  <button
    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
    disabled={currentPage === totalPages}
    className="px-3 py-1 border rounded text-xs disabled:opacity-50"
  >
    Next
  </button>
</div>

    </div>
  );
}

export default OrdersPage;
