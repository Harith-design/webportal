import React, { useState, useEffect } from "react";
import axios from "axios";
import { Package, Truck, Clock, Search, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./DatePicker.css";

function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:8000/api/sap/invoices"); // adjust if your backend URL is different
      if (res.data.status === "success") {
        setInvoices(res.data.data);
      } else {
        setError("Failed to fetch invoices");
      }
    } catch (err) {
      console.error("Error fetching invoices:", err);
      setError("Error fetching invoices");
    } finally {
      setLoading(false);
    }
  };

  fetchInvoices();
}, []);


  // 🔹 States for filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [postStart, setPostStart] = useState(null);
  const [postEnd, setPostEnd] = useState(null);
  const [dueStart, setDueStart] = useState(null);
  const [dueEnd, setDueEnd] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // 🔹 Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // 🔹 Filtering logic
  const filteredInvoices = invoices.filter((inv) => {
    const postingDate = new Date(inv.postingDate);
    const dueDate = new Date(inv.dueDate);

    if (statusFilter !== "all" && inv.status !== statusFilter) return false;
    if (postStart && postingDate < postStart) return false;
    if (postEnd && postingDate > postEnd) return false;
    if (dueStart && dueDate < dueStart) return false;
    if (dueEnd && dueDate > dueEnd) return false;

    if (
      searchQuery &&
      !(
        inv.id.toString().includes(searchQuery) ||
        inv.ponum.toLowerCase().includes(searchQuery.toLowerCase())
      )
    ) {
      return false;
    }
    return true;
  });

  // 🔹 Pagination logic
  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentInvoices = filteredInvoices.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / rowsPerPage));

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
              className="border rounded-lg px-2 py-1 text-xs text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="all">All Status</option>
              <option value="Open">Open</option>
              <option value="Delivered">Delivered</option>
              <option value="In Transit">In Transit</option>
            </select>
          </div>

          {/* Posting Dates */}
          <div className="flex items-center gap-2">
            <label className="text-xs">Posting Date:</label>

            <div className="relative">
              <DatePicker
                selected={postStart}
                onChange={(date) => setPostStart(date)}
                placeholderText="From"
                className="border rounded-lg px-2 py-1 text-xs w-28 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
            </div>

            <div className="relative">
              <DatePicker
                selected={postEnd}
                onChange={(date) => setPostEnd(date)}
                placeholderText="To"
                className="border rounded-lg px-2 py-1 text-xs w-28 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                className="border rounded-lg px-2 py-1 text-xs w-28 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
            </div>

            <div className="relative">
              <DatePicker
                selected={dueEnd}
                onChange={(date) => setDueEnd(date)}
                placeholderText="To"
                className="border rounded-lg px-2 py-1 text-xs w-28 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 py-1 text-xs border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-500"
          />
        </div>
      </div>

      {/* 🔹 Invoices Table */}
      <div className="rounded-xl overflow-hidden shadow-sm min-h-[400px] max-h-[600px] overflow-y-auto">
        {loading && (
  <div className="text-center text-gray-500 py-4">Loading invoices...</div>
)}
{error && (
  <div className="text-center text-red-500 py-4">{error}</div>
)}

        <table className="table-auto w-full border-collapse">
          <thead>
            <tr className="text-center text-sm text-gray-500 border-b">
              <th className="px-4 py-2 font-normal">Invoice No.</th>
              <th className="px-4 py-2 font-normal">Customer</th>
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
            {currentInvoices.length > 0 ? (
              currentInvoices.map((inv) => (
  <tr key={inv.invoiceNo} className="even:bg-gray-50 text-center">
    <td className="px-4 py-2 text-blue-600 hover:underline">
      <Link to={`/invoices/${inv.invoiceNo}`}>{inv.invoiceNo}</Link>
    </td>
    <td className="px-4 py-2">{inv.customer}</td>
    <td className="px-4 py-2">{inv.poNo}</td>
    <td className="px-4 py-2">{inv.postingDate}</td>
    <td className="px-4 py-2">{inv.dueDate}</td>
    <td className="px-4 py-2">{inv.total}</td>
    <td className="px-4 py-2">{inv.currency}</td>
    <td className="px-4 py-2">{renderStatus(inv.status)}</td>
    <td className="px-4 py-2 flex justify-center">
      <a href={inv.download} target="_blank" rel="noopener noreferrer">
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
                  No matching invoices found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-2 mt-4">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded text-xs disabled:opacity-50"
        >
          Prev
        </button>

        <button
          onClick={() => setCurrentPage(1)}
          className={`px-3 py-1 border rounded text-xs ${
            currentPage === 1 ? "bg-blue-500 text-white" : ""
          }`}
        >
          1
        </button>

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

export default InvoicesPage;
