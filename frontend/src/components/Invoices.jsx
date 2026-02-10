import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Receipt, FileCheck, Clock, Search, Calendar, X, ListFilter, ClipboardList, CalendarArrowUp, CalendarClock} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./DatePicker.css";
import { formatDate } from "../utils/formatDate";
import Loader from "../components/Loader";

function InvoicesPage() {
  
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const apiUrl = process.env.REACT_APP_BACKEND_API_URL;

  // Modal states for Order Summary window
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    // State for modal items
    const [modalItems, setModalItems] = useState([]);
    const [modalLoading, setModalLoading] = useState(false);

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

  // query param highlight with the order's docentry
  const location = useLocation();
  const [highlightDocEntry, setHighlightDocEntry] = useState(null);

   // initialize from URL 
    useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const docEntry = searchParams.get("highlight");
  
    if (docEntry) {
      setHighlightDocEntry(docEntry);
  
      // Remove highlight after 5 seconds
      const timer = setTimeout(() => {
        setHighlightDocEntry(null);
      }, 4000);
  
      return () => clearTimeout(timer); // cleanup
    }
  }, [location.search]);
  

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

  const Info = ({ label, value }) => (
  <div className="flex flex-col gap-1">
    <span className="font-semibold">{label}</span>
    <span className="text-gray-600">{value || "-"}</span>
  </div>
);


  return (
    <div className="px-6 pt-2 flex flex-col h-[calc(100vh-6rem)] w-full overflow-hidden">
      {/* Heading section */}
      <div className="pt-4 px-4 mb-2 border border-gray-300 rounded-lg" style={{background: "radial-gradient(circle at 10% 60%, #ffeeee, #a8c5fe)"}}>
      {/* Filters */}
      <div className="flex flex-row items-end justify-between gap-4 mb-4 py-1">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative w-64 rounded-xl">
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
              <div className="absolute left-0 mt-1 w-64 bg-white border rounded-lg shadow-lg z-50">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50 rounded-t-lg">
                  <span className="text-xs font-semibold">Filters</span>

                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="p-1 rounded-md hover:bg-gray-200 transition"
                    type="button"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Content */}
                <div className="flex flex-col gap-2 p-4">
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
                      className="px-3 py-2 rounded-lg text-xs hover:bg-black hover:text-white bg-gray-100"
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
                      className="px-3 py-2 rounded-lg bg-black text-white rounded text-xs hover:bg-gray-100 hover:text-black"
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
    </div>

      {/* Invoices Table */}
      <div ref={tableContainerRef} className="rounded-xl overflow-x-auto border border-gray-300 flex-1">
        <table className="table-auto min-w-max w-full">
          <thead>
            <tr className="text-left text-xs border-b font-medium">
              <th className="px-4 py-2">Invoice No.</th>
              <th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2">PO No.</th>
              <th className="px-4 py-2">Posting Date</th>
              <th className="px-4 py-2">Due Date</th>
              <th className="px-4 py-2">Amount</th>
              <th className="text-center px-4 py-2">Currency</th>
              <th className="px-4 py-2">Status</th>
              <th className="text-center px-4 py-2">Download</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {currentInvoices.length > 0 ? (
              currentInvoices.map((inv) => (
                <tr key={inv.id} className={`even:bg-gray-50 ${
                      highlightDocEntry && highlightDocEntry.toString() === inv.docEntry.toString()
                        ? "bg-yellow-100 even:bg-yellow-100 animate-pulse"
                        : ""
                    }`}>
                  <td className="px-4 py-2 font-semibold hover:underline">
                    <button
                      onClick={async () => {
                        setIsModalOpen(true);
                        setModalLoading(true);
                        setSelectedInvoice(inv);

                        try {
                          const res = await axios.get(`${apiUrl}/api/sap/invoices/${inv.docEntry}/details`);
                          const fullInvoice = res.data?.data;
                          console.log("FULL INVOICE →", fullInvoice);
                          const lines =
                          fullInvoice?.DocumentLines ||
                          fullInvoice?.Lines ||
                          fullInvoice?.documentLines ||
                          [];

                        const rawItems = lines.map((line, index) => ({
                          no: index + 1,
                          itemCode: line.ItemCode || "-",
                          itemName: line.ItemName || line.Description || line.Text || "-",
                          qty: Number(line.Quantity ?? 0),
                          price: Number(line.UnitPrice ?? line.Price ?? 0),
                        }));

                        setModalItems(rawItems);

                        } catch (err) {
                          console.error("Failed loading invoice:", err);
                          setModalItems([]);
                        } finally {
                          setModalLoading(false);
                        }
                      }}
                      className="hover:underline font-semibold"
                    >
                      {inv.id}
                    </button>

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
                  {loading ? 
                  (
                    <div className="flex justify-center items-center">
                      {/* Replace with your loader component */}
                      <Loader imageSrc="/loader.png" size={60} />
                    </div>
                  ) : error ? (
                    error
                  ) : (
                    "No invoices found"
                  )}
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
            className={`px-3 py-1 border rounded text-xs ${currentPage === i + 1 ? "bg-black text-white" : ""}`}
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

      {isModalOpen && selectedInvoice && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">

    <div className="bg-white rounded-xl shadow-xl w-full sm:w-[80vw] md:w-[60vw] lg:w-[50vw] overflow-y-auto relative">

      {/* Header */}
      <div className="sticky top-0">
        <h2 className="text-2xl flex justify-between items-center p-5 font-semibold border-b"
            style={{background: "radial-gradient(circle at 10% 60%, #ffeeee, #a8c5fe)"}}>
          Invoice #{selectedInvoice.id}
          <button
            onClick={() => setIsModalOpen(false)}
            className="bg-black text-white rounded-xl p-1 hover:text-black hover:bg-gray-100"
          >
            <X size={16} />
          </button>
        </h2>
      </div>

      {/* Content */}
      <div className="px-6">
        <h2 className="text-2xl flex font-semibold pt-3 pb-1 mb-2 border-b border-gray-300 bg-white">
          Invoice Summary
        </h2>
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <Info label="Invoice No" value={selectedInvoice.id} />
            <Info label="Billed to" value={selectedInvoice.customer} />
            <Info label="Posting Date" value={formatDate(selectedInvoice.orderDate)} />
            <Info label="Due Date" value={formatDate(selectedInvoice.dueDate)} />
            <Info label="PO No" value={selectedInvoice.poNo} />
            <Info label="Status" value={selectedInvoice.status} />
            <Info
              label="Total"
              value={Number(selectedInvoice.total).toLocaleString(undefined,{
                minimumFractionDigits:2,
                maximumFractionDigits:2
              })}
            />
            <Info label="Currency" value={selectedInvoice.currency} />
          </div>

          {/* Items */}
          {modalLoading ? (
            <p className="text-xs text-gray-500 py-4 text-center">Loading items...</p>
          ) : modalItems.length === 0 ? (
            <p className="text-xs text-gray-500 py-4 text-center">No items found.</p>
          ) : (
            <div className="overflow-x-auto mt-7 border border-black rounded-lg">
              <table className="min-w-full text-xs font-light">
                <thead>
                  <tr>
                    <th className="px-2 py-1 border font-semibold">#</th>
                    <th className="px-2 py-1 border font-semibold">Item Code</th>
                    <th className="px-2 py-1 border font-semibold">Description</th>
                    <th className="px-2 py-1 border font-semibold">Qty</th>
                    <th className="px-2 py-1 border font-semibold">Unit Price</th>
                    <th className="px-2 py-1 border font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {modalItems.map((item) => (
                    <tr key={item.no}>
                      <td className="px-2 py-1 border text-center">{item.no}</td>
                      <td className="px-2 py-1 border">{item.itemCode}</td>
                      <td className="px-2 py-1 border">{item.itemName}</td>
                      <td className="px-2 py-1 border text-center">{item.qty}</td>
                      <td className="px-2 py-1 border text-center">
                        {selectedInvoice.currency} {item.price.toFixed(2)}
                      </td>
                      <td className="px-2 py-1 border text-center">
                        {selectedInvoice.currency} {(item.qty * item.price).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>

          {/* Footer */}
      <div className="flex justify-between mt-5 px-6 pb-2 font-semibold">
        <a
          href={selectedInvoice.download}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-black text-white rounded-2xl text-xs hover:bg-gray-100 hover:text-black"
        >
          Download PDF
        </a>
        <button
          onClick={() => setIsModalOpen(false)}
          className="px-4 py-2 bg-black text-white rounded-2xl text-xs hover:bg-gray-100 hover:text-black"
        >
          Close
        </button>
      </div>
        </div>
      </div>
    )}
    </div>
  );
}

export default InvoicesPage;
