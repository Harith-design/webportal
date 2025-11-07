import React, { useState, useEffect } from "react";
import axios from "axios";
import { PackageOpen, Truck, Clock, Search, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./DatePicker.css"; // <-- your overrides
import { formatDate } from "../utils/formatDate";


function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
  const fetchOrders = async () => {

    // fetch company code (start)
    var user = localStorage.getItem("user");
    if(!user){
      user = sessionStorage.getItem("user");
    }
    var userModel = JSON.parse(user);
    // fetch company code (end)


    try {
      const res = await axios.get("http://127.0.0.1:8000/api/sap/orders");

      
      if (res.data && res.data.data) {
        // 🔹 Transform API keys to match frontend field names if needed

        const filtered = res.data.data.filter(
          (o) => o.customerCode === userModel.cardcode  // 🔹 Only include orders for this company
        );


         const formatted = filtered.map((o) => ({
          id: o.salesNo,
          poNo: o.poNo,
          customer: o.customer,
          orderDate: o.orderDate,
          dueDate: o.dueDate,
          total: o.total,
          currency: o.currency,
          status: o.status,
          download: o.download,

        }));
        setOrders(formatted);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchOrders();
}, []);


  // 🔹 States for filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [orderStart, setOrderStart] = useState(null);
  const [orderEnd, setOrderEnd] = useState(null);
  const [dueStart, setDueStart] = useState(null);
  const [dueEnd, setDueEnd] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const clearFilters = () => {
  setStatusFilter("all");
  setOrderStart(null);
  setOrderEnd(null);
  setDueStart(null);
  setDueEnd(null);
  setSearchQuery("");
};


  // 🔹 Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  

  // 🔹 Filtering logic
  const filteredOrders = orders.filter((order) => {
  const orderDate = new Date(order.orderDate.replace(/-/g, "/"));
  const dueDate = new Date(order.dueDate.replace(/-/g, "/"));


    if (statusFilter && statusFilter !== "all" && order.status !== statusFilter) return false;
    if (orderStart && !orderEnd) {
      // Only filter for the single selected day
      const sameDay =
        orderDate.getFullYear() === orderStart.getFullYear() &&
        orderDate.getMonth() === orderStart.getMonth() &&
        orderDate.getDate() === orderStart.getDate();
      if (!sameDay) return false;
    } else {
      if (orderStart && orderDate < orderStart) return false;
      if (orderEnd && orderDate > orderEnd) return false;
    }

      if (dueStart && !dueEnd) {
        const sameDay =
          dueDate.getFullYear() === dueStart.getFullYear() &&
          dueDate.getMonth() === dueStart.getMonth() &&
          dueDate.getDate() === dueStart.getDate();
        if (!sameDay) return false;
      } else {
        if (dueStart && dueDate < dueStart) return false;
        if (dueEnd && dueDate > dueEnd) return false;
      }


    if (
      searchQuery &&
      !(
        order.id.toString().toLowerCase().includes(searchQuery.toLowerCase())||
        (order.poNo?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (order.customer?.toLowerCase() || "").includes(searchQuery.toLowerCase())
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
            <PackageOpen size={16} className="mr-1" /> {status}
          </span>
        );
      case "Closed":
        return (
          <span className="flex items-center text-green-600">
            <Truck size={16} className="mr-1" /> Delivered
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
    <div className="bg-white p-6 rounded-2xl shadow-md flex flex-col h-[calc(100vh-8rem)] w-full overflow-hidden">
      {/* 🔹 Filters */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
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
              <option value="Closed">Delivered</option>
              <option value="In Transit">In Transit</option>
            </select>
          </div>

          {/* Order Dates */}
          <div className="flex items-center gap-2">
            <label className="text-xs">Order Date From</label>

            <div className="relative">
              <DatePicker
                selected={orderStart}
                onChange={(date) => setOrderStart(date)}
                dateFormat="dd/MM/yyyy"
                className="border rounded-lg px-2 py-1 text-xs w-28 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[15%]"
              />
              <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
            </div>

            {/* "to" text */}
            <span className="text-xs">To</span>

            <div className="relative">
              <DatePicker
                selected={orderEnd}
                onChange={(date) => setOrderEnd(date)}
                dateFormat="dd/MM/yyyy"
                className="border rounded-lg px-2 py-1 text-xs w-28 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[15%]"
              />
              <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
            </div>
          </div>

          {/* Due Dates */}
          <div className="flex items-center gap-2">
            <label className="text-xs">Due Date From</label>

            <div className="relative">
              <DatePicker
                selected={dueStart}
                onChange={(date) => setDueStart(date)}
                dateFormat="dd/MM/yyyy"
                className="border rounded-lg px-2 py-1 text-xs w-28 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[15%]"
              />
              <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
            </div>

            {/* "to" text */}
            <span className="text-xs">To</span>

            <div className="relative">
              <DatePicker
                selected={dueEnd}
                onChange={(date) => setDueEnd(date)}
                dateFormat="dd/MM/yyyy"
                className="border rounded-lg px-2 py-1 text-xs w-28 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[15%]"
              />
              <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
            </div>
          </div>

           {/* 🔹 Clear Filters Button */}
    <button
      onClick={clearFilters}
      className="flex items-center gap-1 text-xs text-red-500 border border-red-300 rounded-lg px-3 py-1 hover:bg-red-50 transition"
    >
      ✕ Clear
    </button>
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
      <div className="rounded-xl overflow-hidden shadow-sm flex-1 overflow-y-auto">
        <table className="table-auto w-full border-collapse">
          <thead>
            <tr className="text-left text-[75%] font-bold border-b">
              <th className="px-4 py-2">SALES NO.</th>
              <th className="px-4 py-2">CUSTOMER</th>
              <th className="px-4 py-2">PO NO.</th>
              <th className="px-4 py-2">ORDER DATE</th>
              <th className="px-4 py-2">DUE DATE</th>
              <th className="px-4 py-2">AMOUNT</th>
              <th className="text-center px-4 py-2">CURRENCY</th>
              <th className="px-4 py-2">STATUS</th>
              <th className="text-center px-4 py-2">DOWNLOAD</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {currentOrders.length > 0 ? (
              currentOrders.map((order) => (
                <tr key={order.id} className="even:bg-gray-50">
                  <td className="px-4 py-2 text-blue-600 hover:underline">
                    <Link to={`/orders/${order.id}`}>{order.id}</Link>
                  </td>
                  <td className="px-4 py-2">{order.customer}</td>
                  <td className="px-4 py-2">{order.poNo}</td>
                  <td className="px-4 py-2">{formatDate(order.orderDate)}</td>
                  <td className="px-4 py-2">{formatDate(order.dueDate)}</td>
                  <td className="px-4 py-2">{Number(order.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="text-center px-4 py-2">{order.currency}</td>
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
                <td colSpan="9" className="text-center py-4 text-gray-500">
                  {loading && "Loading orders..."}
                  {error && error}
                  {!loading && !error && "No orders found"}      
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
<div className="flex justify-center items-center gap-2 mt-4 shrink-0">
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
