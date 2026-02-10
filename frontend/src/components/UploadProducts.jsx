import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { PackageOpen, Truck, Clock, Search, X, PackagePlus, ListFilter, ClipboardList, CalendarArrowUp, CalendarClock, ChevronDown, ChevronUp} from "lucide-react";
import { Link } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./DatePicker.css";
import { formatDate } from "../utils/formatDate";
import { useParams, useLocation } from "react-router-dom";
import Loader from "../components/Loader";
import { getCatalogProducts } from "../services/api";

function UploadProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const apiUrl = process.env.REACT_APP_BACKEND_API_URL;


    //  Modal states for Upload Items
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const [newItem, setNewItem] = useState({
    itemCode: "",
    compoundCode: "",
    width: "",
    topWidth: "",
    baseWidth: "",
    thickness: "",
    length: "",
    isCompound: false,
    isVisible: true,
    });

    // input handler for modal upload item
    const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setNewItem((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
    }));
    };

    // save item in modal
    const handleSave = async () => {
    try {
        await axios.post(`${apiUrl}/api/catalog/items`, newItem);

        setIsCreateOpen(false);

        // refresh table
        const res = await getCatalogProducts();
        setProducts(res);

    } catch (e) {
        alert("Failed to save item");
    }
    };


    const [isDropdownOpen, setIsDropdownOpen] = useState(false); // controls if the dropdown is open

    // derive unique compound codes from products
    const uniqueCompounds = Array.from(new Set(products.map(p => p.compound).filter(Boolean)));



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

  // 🔹 Fetch products (Item Specifications)
  useEffect(() => {
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await getCatalogProducts();

      const mapped = Array.isArray(res)
        ? res.map((p, i) => ({
            id: p?.itemCode ?? `row-${i}`,
            compound: p?.compoundCode ?? "",
            width: p?.width ?? "",
            topWidth: p?.topWidth ?? "",
            baseWidth: p?.baseWidth ?? "",
            thicness: p?.thickness ?? 0,
            length: p?.length ?? 0,
            compoundsku: p?.compoundSKU ?? "",
            isVisible: p?.isVisible ?? false,
          }))
        : [];

      setProducts(mapped);
    } catch {
      setError("Failed to fetch products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  fetchProducts();
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
  if (!loading && products.length > 0) {
    updateRowsPerPage();
  }

  window.addEventListener("resize", updateRowsPerPage);
  return () => window.removeEventListener("resize", updateRowsPerPage);
}, [loading, products, updateRowsPerPage]);


  // 🔹 Filter functions

  const filteredProducts = products.filter((p) => {
  if (!searchQuery) return true;

  const q = searchQuery.toLowerCase();

  return (
    p.id?.toLowerCase().includes(q) ||
    p.compound?.toLowerCase().includes(q) ||
    p.compoundsku?.toLowerCase().includes(q)
  );
});


  // 🔹 Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const indexOfLastProduct = currentPage * rowsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - rowsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / rowsPerPage));


  const renderStatus = (status) => {
    const base =
    "inline-flex items-center gap-1 rounded-xl px-2 leading-none font-medium whitespace-nowrap";

    switch (status) {
      case "Open":
        return <span className={`${base} text-[#007edf]`} style={{ background: "radial-gradient(circle at 30% 70%, #b2faffff, #afc9ffff)" }}><PackageOpen size={16} className="mr-1"/> {status}</span>;
      case "Closed":
        return <span className={`${base} text-[#16aa3dff]`} style={{ background: "radial-gradient(circle at 20% 80%, #c9ffa4ff, #89fdbdff)" }}><Truck size={16} className="mr-1" />Delivered</span>;
      default:
        return status;
    }
  };

  return (
    <div className="px-6 pt-2 flex flex-col h-[calc(100vh-6rem)] w-full overflow-hidden">
      {/* Heading section */}
      <div className="pt-4 px-4 mb-2 border border-gray-300 rounded-lg" style={{background: "radial-gradient(circle at 10% 60%, #ffeeee, #a8c5fe)"}}>
        
      {/* <h2 className="text-lg font-light mb-2 text-center">All your orders that have been processed will be here.</h2> */}
        {/* Filters */}
        <div className="flex flex-row items-end justify-between gap-4 mb-4">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative w-64 rounded-xl">
              <Search size={16} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500"/>
              <input
                type="text"
                placeholder="Search items..."
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

          {/* Upload Product */}
          <div className="flex justify-end">
            <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-black text-white text-xs hover:bg-gray-100 hover:text-black transition font-semibold"
            >
            <PackagePlus size={16}/> New Item
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div ref={tableContainerRef} className="rounded-xl overflow-x-auto border border-gray-300 flex-1">
        <table className="table-auto min-w-max w-full">
          <thead>
            <tr className="text-center text-xs border-b font-medium">
              <th className="px-4 py-2 text-left">Item/SKU Code</th>
              <th className="px-4 py-2 text-left">Compound Category</th>
              <th className="px-4 py-2">Width</th>
              <th className="px-4 py-2">Top Width</th>
              <th className="px-4 py-2">Base Width</th>
              <th className="px-4 py-2">Thickness</th>
              <th className="px-4 py-2">Length</th>
              <th className="px-4 py-2">Is Compound?</th>
              <th className="px-4 py-2">Is Visible?</th>
              {/* <th className="text-center px-4 py-2">Download</th> */}
            </tr>
          </thead>
          <tbody className="text-xs">
            {currentProducts.length > 0 ? (
    currentProducts.map((p) => (
      <tr key={p.id} className="even:bg-gray-50 text-center">

        <td className="px-4 py-2 font-semibold text-left">{p.id}</td>
        <td className="px-4 py-2 text-left">{p.compound}</td>
        <td className="px-4 py-2">{p.width}</td>
        <td className="px-4 py-2">{p.topWidth}</td>
        <td className="px-4 py-2">{p.baseWidth}</td>
        <td className="px-4 py-2">{p.thicness}</td>
        <td className="px-4 py-2">{p.length}</td>
        <td className="px-4 py-2">{p.compoundsku}</td>

        <td className="px-4 py-2">
          {p.isVisible ? (
            <span className="text-green-600 font-semibold">Yes</span>
          ) : (
            <span className="text-gray-400">No</span>
          )}
        </td>

      </tr>
    ))
  ) : (
    <tr>
      <td colSpan="9" className="text-center py-4">
        {loading ? (
          <Loader imageSrc="/loader.png" size={60} />
        ) : (
          "No products found"
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
      {/* modal UI */}
    {isCreateOpen && (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="relative bg-white rounded-2xl shadow-xl w-[500px] p-6">
        <button
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
            onClick={() => setIsCreateOpen(false)}
        >
            <X size={20} />
        </button>
      <h2 className="text-lg font-semibold mb-4">Create New Product</h2>
      <div className="grid grid-cols-1 gap-3 text-sm">

        <input name="itemCode" placeholder="Item Code" onChange={handleChange} className="border p-2 rounded" />
        {/* Compound Code */}
        <div className="relative">
        <button
            type="button"
            className="w-full border p-2 rounded text-left flex justify-between items-center"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
            {newItem.compoundCode || "Select Compound Code"}
            {isDropdownOpen ? (
          <ChevronUp className="w-4 h-4 ml-2" />
        ) : (
          <ChevronDown className="w-4 h-4 ml-2" />
        )}
        </button>

        {isDropdownOpen && (
            <ul className="absolute z-10 w-full max-h-40 overflow-y-auto border rounded mt-1 bg-white">
            {uniqueCompounds.map((code) => (
                <li
                key={code}
                className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                    setNewItem(prev => ({ ...prev, compoundCode: code }));
                    setIsDropdownOpen(false);
                }}
                >
                {code}
                </li>
            ))}
            </ul>
        )}
        </div>


        <div className="grid grid-cols-2 gap-3 text-sm">
        <input name="width" placeholder="Width (mm)" onChange={handleChange} className="border p-2 rounded" />
        <input name="topWidth" placeholder="Top Width (mm)" onChange={handleChange} className="border p-2 rounded" />

        <input name="baseWidth" placeholder="Base Width (mm)" onChange={handleChange} className="border p-2 rounded" />
        <input name="thickness" placeholder="Thickness (mm)" onChange={handleChange} className="border p-2 rounded" />

        <input name="length" placeholder="Length (mm)" onChange={handleChange} className="border p-2 rounded" />
        
        
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="isCompound" onChange={handleChange} />
          Is Compound?
        </label>

        <label className="flex items-center gap-2">
          <input type="checkbox" name="isVisible" defaultChecked onChange={handleChange} />
          Is Visible?
        </label>
        </div>

      </div>

      <div className="flex justify-end gap-2 mt-6">
        <button
          onClick={() => setIsCreateOpen(false)}
          className="px-4 py-2 text-sm border rounded-lg"
        >
          Cancel
        </button>

        <button
          onClick={handleSave}
          className="px-4 py-2 text-sm bg-black text-white rounded-lg"
        >
          Save
        </button>
      </div>

    </div>
  </div>
)}

    </div>

    
  );
  
}

export default UploadProducts;
