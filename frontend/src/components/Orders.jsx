import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { PackageOpen, Truck, Clock, Search, Calendar, X } from "lucide-react";
import { Link } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./DatePicker.css";
import { formatDate } from "../utils/formatDate";

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔹 Filters
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

  // 🔹 Table container ref for dynamic rows
  const tableContainerRef = useRef(null);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // 🔹 Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      let user = localStorage.getItem("user") || sessionStorage.getItem("user");
      let userModel = {};
      try {
        userModel = JSON.parse(user || "{}");
      } catch {
        userModel = {};
      }
      // fetch company code (end)

      try {
        const res = await axios.get("http://127.0.0.1:8000/api/sap/orders");

        if (res.data && res.data.data) {
          // Only include orders for this company
          const filtered = res.data.data.filter(
            (o) => o.customerCode === userModel.cardcode
          );

          // Normalize rows for the table
          const formatted = filtered.map((o) => ({
            id: o.salesNo,                 // visible Sales No
            poNo: o.poNo,
            customer: o.customer,
            orderDate: o.orderDate,
            dueDate: o.dueDate,
            total: o.total,
            currency: o.currency,
            status: o.status,
            docEntry: o.docEntry,          
            download: o.download || "#",
          }));

          setOrders(formatted);
        } else {
          setError("No orders received from SAP API.");
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError("Failed to fetch orders.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // 🔹 Dynamic rows calculation after data loads
  const updateRowsPerPage = useCallback(() => {
  if (!tableContainerRef.current) return;

  const containerHeight = tableContainerRef.current.clientHeight;
  const header = tableContainerRef.current.querySelector("thead");
  const row = tableContainerRef.current.querySelector("tbody tr");

  if (!header || !row) return;

  const headerHeight = header.getBoundingClientRect().height;
  const rowHeight = row.getBoundingClientRect().height;

  const maxRows = Math.floor((containerHeight - headerHeight) / rowHeight);

  setRowsPerPage(Math.max(1, maxRows));
}, []);

useEffect(() => {
  if (!loading && orders.length > 0) {
    updateRowsPerPage();
  }

  window.addEventListener("resize", updateRowsPerPage);
  return () => window.removeEventListener("resize", updateRowsPerPage);
}, [loading, orders, updateRowsPerPage]);


  // 🔹 Filter functions
  const filterByStatus = (order, status) =>
    !status || status === "all" ? true : order.status === status;

  const filterByDate = (dateStr, start, end) => {
    if (!start && !end) return true;
    const date = new Date(dateStr.replace(/-/g, "/"));
    if (start && !end) return (
      date.getFullYear() === start.getFullYear() &&
      date.getMonth() === start.getMonth() &&
      date.getDate() === start.getDate()
    );
    if (start && date < start) return false;
    if (end && date > end) return false;
    return true;
  };

  const filterBySearch = (order, query) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      order.id.toString().toLowerCase().includes(q) ||
      (order.poNo?.toLowerCase() || "").includes(q) ||
      (order.customer?.toLowerCase() || "").includes(q)
    );
  };

  const filteredOrders = orders.filter(
    (o) =>
      filterByStatus(o, statusFilter) &&
      filterByDate(o.orderDate, orderStart, orderEnd) &&
      filterByDate(o.dueDate, dueStart, dueEnd) &&
      filterBySearch(o, searchQuery)
  );

  // 🔹 Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const indexOfLastOrder = currentPage * rowsPerPage;
  const indexOfFirstOrder = indexOfLastOrder - rowsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / rowsPerPage));


  const renderStatus = (status) => {
    switch (status) {
      case "Open":
        return <span className="inline-flex items-center rounded-xl  text-[#007edf] px-2 font-medium" style={{ background: "radial-gradient(circle at 30% 70%, #b2faffff, #afc9ffff)" }}><PackageOpen size={16} className="mr-1"/> {status}</span>;
      case "Closed":
        return <span className="inline-flex items-center rounded-xl  text-[#16aa3dff] px-2 font-medium" style={{ background: "radial-gradient(circle at 20% 80%, #c9ffa4ff, #89fdbdff)" }}><Truck size={16} className="mr-1" />Delivered</span>;
      case "In Transit":
        return <span className="flex items-center text-orange-600"><Clock size={16} className="mr-1" /> {status}</span>;
      default:
        return status;
    }
  };

  return (
    <div className="px-6 pt-2 flex flex-col h-[calc(100vh-6rem)] w-full overflow-hidden">
      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between flex-wrap gap-4 mb-4">
        <div className="flex flex-wrap gap-4">
          {/* Status */}
          <div className="relative min-w-[10%]">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-lg px-2 pr-7 py-1 text-xs text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
            >
              <option value="all">All Status</option>
              <option value="Open">Open</option>
              <option value="Closed">Delivered</option>
              <option value="In Transit">In Transit</option>
            </select>
            {statusFilter !== "all" && (
              <button
                onClick={() => setStatusFilter("all")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-500"
                type="button"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Order Dates */}
          <div className="flex items-center gap-2">
            <label className="text-xs">Order Date From</label>
            <div className="relative">
              <DatePicker
                selected={orderStart}
                onChange={setOrderStart}
                dateFormat="dd/MM/yyyy"
                className="border rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 w-full xs:w-28 md:w-32 text-gray-500"
              />
              {orderStart ? (
                <button
                  onClick={() => setOrderStart(null)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                  type="button"
                >
                  <X size={13} />
                </button>
              ) : (
                <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
              )}
            </div>
            <span className="text-xs">To</span>
            <div className="relative">
              <DatePicker
                selected={orderEnd}
                onChange={setOrderEnd}
                dateFormat="dd/MM/yyyy"
                className="border rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 w-full xs:w-28 md:w-32 text-gray-500"
              />
              {orderEnd ? (
                <button
                  onClick={() => setOrderEnd(null)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                  type="button"
                >
                  <X size={13} />
                </button>
              ) : (
                <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
              )}
            </div>
          </div>

          {/* Due Dates */}
          <div className="flex items-center gap-2">
            <label className="text-xs">Due Date From</label>
            <div className="relative">
              <DatePicker
                selected={dueStart}
                onChange={setDueStart}
                dateFormat="dd/MM/yyyy"
                className="border rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 w-full xs:w-28 md:w-32 text-gray-500"
              />
              {dueStart ? (
                <button
                  onClick={() => setDueStart(null)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-500"
                  type="button"
                >
                  <X size={13} />
                </button>
              ) : (
                <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
              )}
            </div>
            <span className="text-xs">To</span>
            <div className="relative">
              <DatePicker
                selected={dueEnd}
                onChange={setDueEnd}
                dateFormat="dd/MM/yyyy"
                className="border rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 w-full xs:w-28 md:w-32 text-gray-500"
              />
              {dueEnd ? (
                <button
                  onClick={() => setDueEnd(null)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-500"
                  type="button"
                >
                  <X size={13} />
                </button>
              ) : (
                <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
              )}
            </div>
          </div>

          {/* Clear */}
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-[#e60000] border border-[#e60000] rounded-lg px-3 py-1 hover:bg-red-50 transition font-semibold"
          >
            ✕ Clear
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search size={16} className="text-gray-500 absolute left-2 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-6 py-1 text-xs border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-500 text-gray-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-500"
              type="button"
            >
              <X size={13} />
            </button>
          )}
        </div>

      </div>

      {/* Orders Table */}
      <div ref={tableContainerRef} className="rounded-xl overflow-hidden border flex-1">
        <table className="table-auto w-full">
          <thead>
            <tr className="text-left text-xs border-b font-medium">
              <th className="px-4 py-2">Sales No.</th>
              <th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2">Po No.</th>
              <th className="px-4 py-2">Order Date</th>
              <th className="px-4 py-2">Due Date</th>
              <th className="px-4 py-2">Amount</th>
              <th className="text-center px-4 py-2">Currency</th>
              <th className="px-4 py-2">Status</th>
              <th className="text-center px-4 py-2">Download</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {currentOrders.length > 0 ? (
              currentOrders.map((order) => (
                <tr key={order.id} className="even:bg-gray-50">
                  <td className="px-4 py-2 text-blue-600 hover:underline">
                    <Link to={`/orders/${order.id}?de=${order.docEntry}`}>
                      {order.id}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{order.customer}</td>
                  <td className="px-4 py-2">{order.poNo}</td>
                  <td className="px-4 py-2">{formatDate(order.orderDate)}</td>
                  <td className="px-4 py-2">{formatDate(order.dueDate)}</td>
                  <td className="px-4 py-2">{Number(order.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="text-center px-4 py-2">{order.currency}</td>
                  <td className="px-4 py-2 justify-center">{renderStatus(order.status)}</td>
                  <td className="px-4 py-2 flex justify-center">
                    <a href={order.download} target="_blank" rel="noopener noreferrer">
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
                  {loading ? "Loading orders..." : error || "No orders found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-2 mt-4 shrink-0">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded text-xs disabled:opacity-50"
        >
          Prev
        </button>

        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i + 1}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-3 py-1 border rounded text-xs ${currentPage === i + 1 ? "bg-blue-500 text-white" : ""}`}
          >
            {i + 1}
          </button>
        ))}

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
