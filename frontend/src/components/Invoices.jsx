import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Receipt, FileCheck, Clock, Search, Calendar, X, ListFilter, ClipboardList, CalendarArrowUp, CalendarClock} from "lucide-react";
import { Link } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./DatePicker.css";
import { formatDate } from "../utils/formatDate";

function InvoicesPage() {
  
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔹 Fetch invoices
  useEffect(() => {
    const fetchInvoices = async () => {
      let user = localStorage.getItem("user") || sessionStorage.getItem("user");
      const userModel = JSON.parse(user || "{}");

      try {
        const res = await axios.get("http://127.0.0.1:8000/api/sap/invoices");

        if (res.data?.data) {
          const filtered = res.data.data.filter(
            (v) => v.customerCode === userModel.cardcode
          );

          const formatted = filtered.map((v) => ({
            id: v.invoiceNo,
            invoiceNo: v.invoiceNo,
            poNo: v.poNo,
            customer: v.customer,
            orderDate: v.postingDate,
            dueDate: v.dueDate,
            total: v.total,
            currency: v.currency,
            status: v.status,
            download: v.download || "#",
            customerCode: v.customerCode,
            docEntry: v.docEntry,
            items: v.items || [],
            discount: v.discount || 0,
            vat: v.vat || 0,
            billTo: v.billTo || "",
            shipTo: v.shipTo || "",
          }));

          setInvoices(formatted);
        } else {
          setError("No invoices received from SAP API.");
        }
      } catch (err) {
        console.error("Error fetching invoices:", err);
        setError("Failed to fetch invoices.");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  // Temporary (inside popup)
  const [tempStatus, setTempStatus] = useState("all");
  const [tempOrderStart, setTempOrderStart] = useState(null);
  const [tempOrderEnd, setTempOrderEnd] = useState(null);
  const [tempDueStart, setTempDueStart] = useState(null);
  const [tempDueEnd, setTempDueEnd] = useState(null);

  // 🔹 Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [orderStart, setOrderStart] = useState(null);
  const [orderEnd, setOrderEnd] = useState(null);
  const [dueStart, setDueStart] = useState(null);
  const [dueEnd, setDueEnd] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);

  const clearFilters = () => {
    setTempStatus("all");
    setTempOrderStart(null);
    setTempOrderEnd(null);
    setTempDueStart(null);
    setTempDueEnd(null);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

  // 🔹 Dynamic rows calculation
  useEffect(() => {
    const updateRowsPerPage = () => {
      if (!tableContainerRef.current) return;

      const containerHeight = tableContainerRef.current.clientHeight;
      const header = tableContainerRef.current.querySelector("thead");
      const row = tableContainerRef.current.querySelector("tbody tr");

      if (!header || !row) return;

      const headerHeight = header.getBoundingClientRect().height;
      const rowHeight = row.getBoundingClientRect().height;

      const maxRows = Math.floor((containerHeight - headerHeight) / rowHeight);
      setRowsPerPage(Math.max(1, maxRows));
    };

    if (!loading && invoices.length > 0) updateRowsPerPage();

    window.addEventListener("resize", updateRowsPerPage);
    return () => window.removeEventListener("resize", updateRowsPerPage);
  }, [loading, invoices]);

  // 🔹 Filter functions
  const filterByStatus = (inv, status) =>
    !status || status === "all" ? true : inv.status === status;

  const filterByDate = (dateStr, start, end) => {
    if (!start && !end) return true;
    const date = new Date(dateStr.replace(/-/g, "/"));
    if (start && !end)
      return (
        date.getFullYear() === start.getFullYear() &&
        date.getMonth() === start.getMonth() &&
        date.getDate() === start.getDate()
      );
    if (start && date < start) return false;
    if (end && date > end) return false;
    return true;
  };

  const filterBySearch = (inv, query) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      inv.id.toString().toLowerCase().includes(q) ||
      (inv.poNo?.toLowerCase() || "").includes(q) ||
      (inv.customer?.toLowerCase() || "").includes(q)
    );
  };

  const filteredInvoices = invoices.filter(
    (inv) =>
      filterByStatus(inv, statusFilter) &&
      filterByDate(inv.orderDate, orderStart, orderEnd) &&
      filterByDate(inv.dueDate, dueStart, dueEnd) &&
      filterBySearch(inv, searchQuery)
  );

  // 🔹 Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentInvoices = filteredInvoices.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / rowsPerPage));

  const renderStatus = (status) => {
    switch (status) {
      case "Open":
        return (
          <span className="inline-flex items-center rounded-xl  text-[#007edf] px-2 font-medium" style={{ background: "radial-gradient(circle at 30% 70%, #b2faffff, #afc9ffff)" }}>
            <Receipt size={16} className="mr-1" /> {status}
          </span>
        );
      case "Closed":
        return (
          <span className="inline-flex items-center rounded-xl  text-[#16aa3dff] px-2 font-medium" style={{ background: "radial-gradient(circle at 20% 80%, #c9ffa4ff, #89fdbdff)" }}>
            <FileCheck size={16} className="mr-1" /> Delivered
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
    <div className="px-6 pt-2 flex flex-col h-[calc(100vh-6rem)] w-full overflow-hidden">
      {/* Filters */}
      <div className="flex flex-row items-end justify-between gap-4 mb-4 py-1">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative w-64 bg-white rounded-xl">
            <Search size={16} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500"/>
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 py-1 text-xs border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-500"
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

          {/* Filter Icon */}
          <div className="relative" ref={filterRef}>
            <button
              // onClick={() => setModalOpen(true)} you can handle opening your modal here
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2 px-2 py-1 border rounded-lg text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-xs"
            >
              <ListFilter size={16} /> Filter
            </button>
            {isFilterOpen && (
              <div className="absolute left-0 mt-1 w-64 bg-white border rounded-lg shadow-lg z-50 p-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1">
                    <ClipboardList className="w-4 h-4 text-gray-700 mr-1"/>
                    <label className="text-xs font-medium">Status</label>
                  </div>
                  <select
                    value={tempStatus}
                    onChange={(e) => setTempStatus(e.target.value)}
                    className="border rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="all">All Status</option>
                    <option value="Open">Open</option>
                    <option value="Closed">Delivered</option>
                  </select>

                  <div className="flex items-center gap-1">
                  <CalendarArrowUp className="w-4 h-4 text-gray-700 mr-1"/>
                  <label className="text-xs font-medium">Order Date</label>
                  </div>

                  <div className="relative w-full">
                  <DatePicker
                    selected={tempOrderStart}
                    onChange={(date) => setTempOrderStart(date)}
                    placeholderText="Start"
                    dateFormat="dd/MM/yyyy"
                    className="border rounded-lg px-2 py-1 text-xs w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                    wrapperClassName="w-full"
                  />
                  {tempOrderStart && (
                    <button
                      onClick={() => setTempOrderStart(null)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-500"
                      type="button"
                    >
                      <X size={13} />
                    </button>
                  )}
                  </div>

                  <div className="relative w-full">
                  <DatePicker
                    selected={tempOrderEnd}
                    onChange={(date) => setTempOrderEnd(date)}
                    selectsEnd
                    placeholderText="End"
                    dateFormat="dd/MM/yyyy"
                    className="border rounded-lg px-2 py-1 text-xs w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                    wrapperClassName="w-full"
                  />
                  {tempOrderEnd && (
                    <button
                      onClick={() => setTempOrderEnd(null)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-500"
                      type="button"
                    >
                      <X size={13} />
                    </button>
                  )}
                  </div>

                  <div className="flex items-center gap-1">
                  <CalendarClock className="w-4 h-4 text-gray-700 mr-1"/>
                  <label className="text-xs font-medium">Due Date</label>
                  </div>

                  <div className="relative w-full">
                  <DatePicker
                    selected={tempDueStart}
                    onChange={(date) => setTempDueStart(date)}
                    placeholderText="Start"
                    dateFormat="dd/MM/yyyy"
                    className="border rounded-lg px-2 py-1 text-xs w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                    wrapperClassName="w-full"
                  />
                  {tempDueStart && (
                    <button
                      onClick={() => tempDueStart(null)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-500"
                      type="button"
                    >
                      <X size={13} />
                    </button>
                  )}
                  </div>

                  <div className="relative w-full">
                  <DatePicker
                    selected={tempDueEnd}
                    onChange={(date) => setTempDueEnd(date)}
                    placeholderText="End"
                    dateFormat="dd/MM/yyyy"
                    className="border rounded-lg px-2 py-1 text-xs w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                    wrapperClassName="w-full"
                  />
                  {tempDueEnd && (
                    <button
                      onClick={() => tempDueEnd(null)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-500"
                      type="button"
                    >
                      <X size={13} />
                    </button>
                  )}
                  </div>

                  <div className="flex justify-end gap-1 mt-2 font-semibold">
                    <button
                      onClick={clearFilters}
                      className="px-3 py-2 rounded-lg text-xs hover:bg-gray-200"
                    >
                      Clear Filters
                    </button>
                    <button
                      onClick={() => {
                        setStatusFilter(tempStatus);
                        setOrderStart(tempOrderStart);
                        setOrderEnd(tempOrderEnd);
                        setDueStart(tempDueStart);
                        setDueEnd(tempDueEnd);
                        }
                        }
                      className="px-3 py-2 rounded-lg bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div ref={tableContainerRef} className="rounded-xl overflow-x-auto border border-gray-300 flex-1">
        <table className="table-auto  min-w-max w-full">
          <thead>
            <tr className="text-left text-xs border-b font-medium">
              <th className="px-4 py-2">Invoice No.</th>
              <th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2">PO No.</th>
              <th className="px-4 py-2">Posting Date</th>
              <th className="px-4 py-2">Due Date</th>
              <th className="px-4 py-2">Total</th>
              <th className="text-center px-4 py-2">Currency</th>
              <th className="px-4 py-2">Status</th>
              <th className="text-center px-4 py-2">Download</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {currentInvoices.length > 0 ? (
              currentInvoices.map((inv) => (
                <tr key={inv.id} className="even:bg-gray-50">
                  <td className="px-4 py-2 text-blue-600 hover:underline">
                    <Link
                      to={`/invoices/${inv.invoiceNo}`}
                      state={{
                        invoice: {
                          id: inv.invoiceNo,
                          ponum: inv.poNo,
                          customer: inv.customer,
                          invoiceDate: inv.orderDate,
                          dueDate: inv.dueDate,
                          status: inv.status,
                          currency: inv.currency,
                          items: inv.items,
                          discount: inv.discount,
                          vat: inv.vat,
                          billTo: inv.billTo,
                          shipTo: inv.shipTo,
                        },
                      }}
                    >
                      {inv.invoiceNo}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{inv.customer}</td>
                  <td className="px-4 py-2">{inv.poNo}</td>
                  <td className="px-4 py-2">{formatDate(inv.orderDate)}</td>
                  <td className="px-4 py-2">{formatDate(inv.dueDate)}</td>
                  <td className="px-4 py-2">{Number(inv.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="text-center px-4 py-2">{inv.currency}</td>
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
                <td colSpan="9" className="text-center py-4 text-gray-500">
                  {loading ? "Loading invoices..." : error || "No invoices found"}
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

export default InvoicesPage;
