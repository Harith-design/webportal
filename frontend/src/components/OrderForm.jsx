import React, { useState, useRef, useEffect } from "react";
import { Trash2, Search, Loader2, Calendar, ArrowRightLeft} from "lucide-react";
import { getItems } from "../services/api";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";
import axios from "axios";
import "./OrderForm.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./DatePicker.css";

function PlaceOrderPage() {
  const [order, setOrder] = useState({
    ponum: "",
    deliveryDate: "",
    billingAddress: "",
    shippingAddress: "",
  });

  // 🧩 BP addresses (fetched from backend)
  const [bpAddresses, setBpAddresses] = useState({
    shipTo: [],
    billTo: [],
    defaults: {},
  });
  const [shipToFull, setShipToFull] = useState(""); // preview
  const [billToFull, setBillToFull] = useState(""); // preview

  // Approximate row height in px (adjust to match your CSS)
  const ROW_HEIGHT = 40;

  // Maximum table height (match your Tailwind max-h or calc value)
  const TABLE_MAX_HEIGHT = 600; // px, adjust to your design

  // Number of rows to fill the table
  const visibleRowsCount = Math.floor(TABLE_MAX_HEIGHT / ROW_HEIGHT);

  const [rows, setRows] = useState(
    Array.from({ length: visibleRowsCount }, (_, i) => ({
      product: "",
      description: "",
      quantity: "",
      unitPrice: "",
      weight: "",
      totalWeight: "",
      lineTotal: "",
      taxCode: "",
      active: i !== visibleRowsCount - 1, // only first row active initially
    }))
  );

  const [itemOptions, setItemOptions] = useState({});
  const [loadingRow, setLoadingRow] = useState(null);
  const [orderTotal, setOrderTotal] = useState("0.00");
  const [userCompany, setUserCompany] = useState({ cardcode: "", cardname: "" });
  const searchTimers = useRef({});
  
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [modalType, setModalType] = useState("ship"); // 'ship' or 'bill'

  // 🔁 Auto-calc order total
  useEffect(() => {
    const total = rows.reduce(
      (sum, row) => sum + parseFloat(row.lineTotal || 0),
      0
    );
    setOrderTotal(total.toFixed(2));
  }, [rows]);


  // 👉 format full address for preview with a forced first line label
  const formatAddressForDisplay = (a, kind /* 'ship' | 'bill' */) => {
    if (!a) return "";
    const firstLine = kind === "ship" ? "Ship To" : "Bill To";
    const lines = [
      firstLine,
      [a.Building, a.Street].filter(Boolean).join(", "),
      [a.ZipCode, a.City].filter(Boolean).join(" "),
      [a.County, a.Country].filter(Boolean).join(", "),
    ].filter(Boolean);
    return lines.join("\n");
  };

  /// 🔹 Fetch user's company, then their BP addresses (defaults populate)
  useEffect(() => {
    const fetchUserCompany = async () => {
      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const apiUrl = process.env.REACT_APP_BACKEND_API_URL;

        const res = await axios.get(`${apiUrl}/api/user/company`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data?.cardcode && res.data?.cardname) {
          const comp = { cardcode: res.data.cardcode, cardname: res.data.cardname };
          setUserCompany(comp);
          await fetchBpAddresses(comp.cardcode);
        } else {
          toast.error("Company info not found. Please update your profile.");
        }
      } catch (err) {
        console.error("Failed to fetch company info:", err);
        toast.error("Unable to get company info.");
      }
    };

    const fetchBpAddresses = async (cardCode) => {
      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const apiUrl = process.env.REACT_APP_BACKEND_API_URL;

        const addrRes = await axios.get(
          `${apiUrl}/api/sap/business-partners/${encodeURIComponent(cardCode)}/addresses`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (addrRes.data?.status === "success") {
          const { shipTo, billTo } = addrRes.data;

          const shipList = Array.isArray(shipTo) ? shipTo : [];
          const billList = Array.isArray(billTo) ? billTo : [];

          setBpAddresses({
            shipTo: shipList,
            billTo: billList,
            defaults: addrRes.data.defaults || {},
          });

          // pick defaults (or first) per type and reflect in state + preview
          const defShip = shipList.find((x) => x.IsDefault) || shipList[0] || null;
          const defBill = billList.find((x) => x.IsDefault) || billList[0] || null;

          setOrder((prev) => ({
            ...prev,
            shippingAddress: defShip?.AddressName || "",
            billingAddress: defBill?.AddressName || "",
          }));
          setShipToFull(formatAddressForDisplay(defShip, "ship"));
          setBillToFull(formatAddressForDisplay(defBill, "bill"));
        } else {
          toast.error("Failed to fetch BP addresses.");
        }
      } catch (e) {
        console.error("Failed to fetch BP addresses:", e);
        toast.error("Unable to fetch Ship-To/Bill-To.");
      }
    };

    fetchUserCompany();
  }, []);

  // keep previews synced if state changes elsewhere
  useEffect(() => {
    const s = bpAddresses.shipTo.find((x) => x.AddressName === order.shippingAddress);
    setShipToFull(formatAddressForDisplay(s, "ship"));
  }, [order.shippingAddress, bpAddresses.shipTo]);
  
  useEffect(() => {
    const b = bpAddresses.billTo.find((x) => x.AddressName === order.billingAddress);
    setBillToFull(formatAddressForDisplay(b, "bill"));
  }, [order.billingAddress, bpAddresses.billTo]);

  const handleChange = (index, field, value) => {
    const updated = [...rows];
    updated[index][field] = value;

    const qty = parseFloat(updated[index].quantity) || 0;
    const price = parseFloat(updated[index].unitPrice) || 0;
    const weight = parseFloat(updated[index].weight) || 0;

    updated[index].lineTotal = (qty * price).toFixed(2);
    updated[index].totalWeight = (qty * weight).toFixed(2);
    setRows(updated);
  };

  const activateRow = (index) => {
    setRows((prevRows) => {
      const updated = prevRows.map((row, i) =>
        i === index ? { ...row, active: true } : row
      );
      if (updated[updated.length - 1].active) {
        updated.push({
          product: "",
          description: "",
          quantity: "",
          unitPrice: "",
          weight: "",
          totalWeight: "",
          lineTotal: "",
          taxCode: "",
          active: false,
        });
      }
      return updated;
    });
  };

  const dropdownRefs = useRef({});
  const searchInputRefs = useRef({});
  const [dropdownDir, setDropdownDir] = useState({});
  const inputRefs = useRef({});

  const decideDropdownDirection = (index) => {
    const inputEl = inputRefs.current[index];
    if (!inputEl) return;

    const rect = inputEl.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropdownHeight = 200; // px, match your CSS max-height

    if (spaceBelow < dropdownHeight) {
      setDropdownDir((p) => ({ ...p, [index]: "up" }));
    } else {
      setDropdownDir((p) => ({ ...p, [index]: "down" }));
    }
  };

  useEffect(() => {
    function handleClickOutside(e) {
      Object.keys(dropdownRefs.current).forEach((idx) => {
        const drop = dropdownRefs.current[idx];
        const input = searchInputRefs.current[idx];

        if (
          drop &&
          !drop.contains(e.target) &&
          input &&
          !input.contains(e.target)
        ) {
          setItemOptions((prev) => ({ ...prev, [idx]: [] }));
        }
      });
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDelete = (index) => {
    setRows((prevRows) => {
      if (!prevRows[index].active) return prevRows;
      const updated = prevRows.filter((_, i) => i !== index);
      if (!updated.some((row) => row.active === false)) {
        updated.push({
          product: "",
          description: "",
          quantity: "",
          unitPrice: "",
          weight: "",
          totalWeight: "",
          lineTotal: "",
          taxCode: "",
          active: false,
        });
      }
      return updated;
    });
  };

  // 🔍 Search items from SAP
  const handleSearch = (index, query) => {
    handleChange(index, "product", query);
    if (query.length < 2) return;

    if (searchTimers.current[index]) clearTimeout(searchTimers.current[index]);

    searchTimers.current[index] = setTimeout(async () => {
      try {
        setLoadingRow(index);
        const response = await getItems(query);
        const items = response?.data?.data || response?.data || [];
        setItemOptions((prev) => ({
          ...prev,
          [index]: Array.isArray(items) ? items : [],
        }));
      } catch (error) {
        console.error("Error fetching items:", error);
        setItemOptions((prev) => ({ ...prev, [index]: [] }));
      } finally {
        setLoadingRow(null);
      }
    }, 500);
  };

  // 🔹 When an item is selected: set product/description and auto-fetch weight from SAP
  const handleSelectItem = async (index, item) => {
    // Set basic fields first
    const updated = [...rows];
    updated[index].product = item.ItemCode || "";
    updated[index].description = item.ItemName || item.Description || "";
    updated[index].unitPrice = "";
    updated[index].weight = "";
    updated[index].totalWeight = "";
    updated[index].lineTotal = "";
    setRows(updated);
    setItemOptions((prev) => ({ ...prev, [index]: [] }));

    // Fetch weight per piece from backend (SAP B1 Item Master)
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_BACKEND_API_URL;

      const res = await axios.get(
        `${apiUrl}/api/sap/items/${encodeURIComponent(item.ItemCode)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const weightPerPcs = Number(res?.data?.data?.Weight || 0);

      if (weightPerPcs > 0) {
        setRows((prevRows) => {
          const newRows = [...prevRows];
          if (!newRows[index]) return newRows;

          const row = { ...newRows[index] };
          const qty = parseFloat(row.quantity) || 0;

          row.weight = weightPerPcs.toFixed(2);                // KG per PCS
          row.totalWeight = (qty * weightPerPcs).toFixed(2);   // Total KG

          newRows[index] = row;
          return newRows;
        });
      }
    } catch (err) {
      console.error("Failed to fetch item details from SAP", err);
      toast.error("Failed to load item weight from SAP.");
    }
  };

  // ✅ Submit order to backend (real SAP creation)
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");

      if (!userCompany.cardcode || !userCompany.cardname) {
        toast.error("Missing company info. Please update your profile.");
        return;
      }

      // 🔹 Prepare payload to match SAP API
      const payload = {
        CardCode: userCompany.cardcode,
        CardName: userCompany.cardname,
        DocDate: new Date().toISOString().split("T")[0],
        DocDueDate: order.deliveryDate || new Date().toISOString().split("T")[0],
        Comments: order.ponum || "",
        // send AddressName codes selected in the dropdowns
        ShipToCode: order.shippingAddress || undefined,
        PayToCode: order.billingAddress || undefined,
        DocumentLines: rows
          .filter((row) => row.active && row.product)
          .map((r) => ({
            ItemCode: r.product,
            Quantity: parseFloat(r.quantity) || 0,
            UnitPrice: parseFloat(r.unitPrice) || 0,
            U_Weight: parseFloat(r.weight) || 0,
            TaxCode: "SR-0",
          })),
      };

      console.log("📦 Sending payload to backend:", payload);
      // 🔹 Send request to Laravel backend
      const apiUrl = process.env.REACT_APP_BACKEND_API_URL;
      const res = await axios.post(
        `${apiUrl}/api/sap/sales-orders`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.data.status === "success") {
        toast.success(`Sales Order Created! DocNum: ${res.data.data.DocNum}`);
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
        });
        console.log("SAP Response:", res.data);
      } else {
        console.error("SAP Error:", res.data);
        toast.error(res.data.message || "Failed to create Sales Order.");
      }
    } catch (err) {
      console.error("Failed to submit order:", err);
      toast.error(
        err.response?.data?.message ||
          "Something went wrong while submitting the order."
      );
    }
  };

  return (
    <div className="max-w-full mx-auto order-form-page w-full py-2 px-6">
      {/* Header */}
      <div className="grid grid-cols-1 grid-cols-2 w-full gap-5 lg:gap-26 py-3">
        <form onSubmit={handleSubmit} className="grid lg:grid-cols-2 grid-cols-1 gap-y-3 gap-x-6">

          {/* Requested Delivery Date */}
          <div className="grid grid-cols-[max-content_1fr] items-end gap-2 w-full">
            <div className="flex items-center gap-5">
              <label className="text-xs whitespace-nowrap">Requested Delivery Date</label>
            
              <div className="relative w-full">
                <DatePicker
                  selected={order.deliveryDate ? new Date(order.deliveryDate) : null}
                  onChange={(date) => {
                    const formattedDate = date ? date.toISOString().split("T")[0] : "";
                    setOrder({ ...order, deliveryDate: formattedDate });
                  }}
                  dateFormat="dd-MM-yyyy"
                  className="w-full border rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-500"
                  wrapperClassName="w-full"
                  required
                />
                <Calendar className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>

        </form>

        {/* Preview */}
        <div className="flex-1 justify-self-end sm:max-w-sm lg:max-w-lg">
          <div className="grid lg:grid-cols-2 gap-7 lg:gap-16">
            <div className="relative">
              <p className="text-xs font-semibold mb-2 flex items-center justify-between">
                Shipping Address
                <button
                  type="button"
                  onClick={() => {
                    setModalType("ship"); // or "bill" if for billing
                    setShowAddressModal(true);
                  }}
                  className="ml-2 p-1 rounded hover:bg-gray-200"
                >
                  <ArrowRightLeft size={16} />
                  {/* Tooltip */}
                  <span className="
                    absolute left-1/2 -translate-x-1/2 top-full mt-1
                    hidden group-hover:block
                    px-2 py-1 text-[10px] text-white
                    bg-black rounded shadow
                    whitespace-nowrap z-50
                  ">
                    Change Address
                  </span>
                </button>
              </p>
              <p className="text-xs">
                {shipToFull || "Select from dropdown"}
              </p>
              
            </div>
            <div className="relative">
              <p className="text-xs font-semibold mb-2 flex items-center justify-between">
                Billing Address
                <button
                  type="button"
                  onClick={() => {
                    setModalType("bill"); // or "bill" if for billing
                    setShowAddressModal(true);
                  }}
                  className="ml-2 p-1 rounded hover:bg-gray-200"
                >
                  <ArrowRightLeft size={16} />
                </button>
              </p>
              <p className="text-xs">
                {billToFull || "Select from dropdown"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="scrollbar grid grid-cols-1 mt-4 overflow-y-auto overflow-x-auto max-h-[calc(100vh-19rem)] border border-gray-300 rounded-md">
        <div>
          <div className="min-w-[1200px]">
            <table className="table-auto w-full border-collapse text-xs font-sans">
              <thead className="sticky top-0 z-20 bg-gray-200 text-gray-700 font-semibold sticky-shadow">
                <tr>
                  <th className="px-2 py-1 w-2/12 border-l border-r border-b border-gray-300">Item No.</th>
                  <th className="px-2 py-1 w-2/12 border-l border-r border-b border-gray-300">Item Description</th>
                  <th className="px-2 py-1 w-1/12 border-l border-r border-b border-gray-300">Quantity</th>
                  <th className="px-2 py-1 w-1/12 border-l border-r border-b border-gray-300">Unit Price</th>
                  <th className="px-2 py-1 w-1/12 border-l border-r border-b border-gray-300">Weight</th>
                  <th className="px-2 py-1 w-1/12 border-l border-r border-b border-gray-300">Total Weight</th>
                  <th className="px-2 py-1 w-1/12 border-l border-r border-b border-gray-300">Total Amount</th>
                  <th className="px-2 py-1 w-1/12 border-l border-r border-b border-gray-300">Delete</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row, index) => {
                  const isActive = row.active;
                  const items = itemOptions[index] || [];
                  const isLoading = loadingRow === index;

                  const inputBase =
                    "w-full px-1 py-0.5 text-xs bg-white focus:ring-blue-400";
                  const inputActive =
                    "placeholder-gray-500 focus:ring-2 focus:ring-blue-400 focus:outline-none";
                  const inputInactive = "placeholder-gray-400 ";
                  const inputClass = `${inputBase} ${
                    isActive ? inputActive : inputInactive
                  }`;

                  return (
                    <tr
                      key={index}
                      className={`border border-gray-300 ${
                        isActive ? "bg-white" : "bg-gray-50 text-gray-400"
                      }`}
                    >
                      {/* Item Code Search */}
                      <td className="p-1 border border-gray-300 relative">
                        <input
                          ref={(el) => (searchInputRefs.current[index] = el)}
                          type="text"
                          placeholder={
                            isActive ? "Type to search item" : "Click to add an item"
                          }
                          value={row.product}
                          onChange={(e) => handleSearch(index, e.target.value)}
                          onFocus={() => {
                            activateRow(index);
                            decideDropdownDirection(index);
                          }}
                          className={`${inputClass} pl-2 pr-8`}
                        />
                        <span
                          className={`absolute right-2 top-1/2 -translate-y-1/2 ${
                            isActive ? "text-gray-400" : "text-gray-300"
                          }`}
                        >
                          {isLoading ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Search size={14} />
                          )}
                        </span>

                        {items.length > 0 && (
                          <ul 
                            ref={(el) => (dropdownRefs.current[index] = el)}
                            className={`bg-white absolute z-10 left-full ml-2 w-56 border rounded shadow-md w-full text-xs mt-1 max-h-40 overflow-y-auto ${dropdownDir[index] === "up" ? "bottom-0 mb-1" : "top-0 mt-1"}`}>
                            {items.map((item) => (
                              <li
                                key={item.ItemCode}
                                onClick={() => handleSelectItem(index, item)}
                                className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
                              >
                                {item.ItemCode} —{" "}
                                {item.ItemName || item.Description}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>

                      {/* Description */}
                      <td className="border border-gray-300 p-1">
                        <input
                          type="text"
                          value={row.description}
                          readOnly
                          onChange={(e) =>
                            handleChange(index, "description", e.target.value)
                          }
                          disabled={isActive}
                          className={inputClass}
                        />
                      </td>

                      {/* Quantity */}
                      <td className="border border-gray-300 p-1">
                        <input
                          type="number"
                          placeholder="No."
                          value={row.quantity}
                          onChange={(e) =>
                            handleChange(index, "quantity", e.target.value)
                          }
                          onFocus={() => activateRow(index)}
                          disabled={!isActive}
                          className={inputClass}
                        />
                      </td>

                      {/* Unit Price */}
                      <td className="border border-gray-300 p-1">
                        <input
                          type="number"
                          placeholder="0.00"
                          value={row.unitPrice}
                          readOnly
                          onChange={(e) =>
                            handleChange(index, "unitPrice", e.target.value)
                          }
                          disabled={isActive}
                          className={inputClass}
                        />
                      </td>

                      {/* Weight */}
                      <td className="border border-gray-300 p-1">
                        <input
                          type="number"
                          placeholder="0.00"
                          value={row.weight}
                          readOnly
                          onChange={(e) =>
                            handleChange(index, "weight", e.target.value)
                          }
                          disabled={isActive}
                          className={inputClass}
                        />
                      </td>

                      {/* Total Weight */}
                      <td className="border border-gray-300 p-1">
                        <input
                          type="number"
                          placeholder="0.00"
                          value={row.totalWeight}
                          readOnly
                          disabled={isActive}
                          className={inputClass}
                        />
                      </td>

                      {/* Line Total */}
                      <td className="border border-gray-300 p-1">
                        <input
                          type="number"
                          placeholder="0.00"
                          value={row.lineTotal}
                          readOnly
                          disabled={isActive}
                          className={inputClass}
                        />
                      </td>

                      {/* Delete */}
                      <td className="p-1 flex justify-center items-center">
                        <button
                          type="button"
                          onClick={() => isActive && handleDelete(index)}
                          disabled={!isActive}
                          className={`p-1 ${
                            isActive
                              ? "text-red-500 hover:text-red-700"
                              : "text-gray-300 cursor-not-allowed"
                          }`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ✅ Live Order Total */}
      <div className="flex justify-end mt-6">
        <div className="inline-flex flex-col">
          <p className="text-xs mb-2">
            Total Order: <span className="ml-2">RM {orderTotal}</span>
          </p>

          <button
            type="submit"
            onClick={handleSubmit}
            className="bg-blue-600 text-white text-xs font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition w-full"
          >
            Submit Order
          </button>
        </div>
      </div>

      {showAddressModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
          onClick={() => setShowAddressModal(false)}
        >
          <div
            className="bg-white rounded-lg p-4 w-80 max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
          >
            <h3 className="text-sm font-semibold mb-2">
              Change {modalType === "ship" ? "Shipping" : "Billing"} Address
            </h3>
            <ul>
              {(modalType === "ship" ? bpAddresses.shipTo : bpAddresses.billTo).map(
                (addr) => (
                  <li
                    key={addr.AddressName}
                    onClick={() => {
                      if (modalType === "ship") {
                        setOrder((prev) => ({ ...prev, shippingAddress: addr.AddressName }));
                        setShipToFull(formatAddressForDisplay(addr, "ship"));
                      } else {
                        setOrder((prev) => ({ ...prev, billingAddress: addr.AddressName }));
                        setBillToFull(formatAddressForDisplay(addr, "bill"));
                      }
                      setShowAddressModal(false);
                    }}
                    className="px-2 py-1 mb-1 cursor-pointer hover:bg-gray-100 rounded"
                  >
                    {formatAddressForDisplay(addr, modalType)}
                  </li>
                )
              )}
            </ul>
            <button
              className="mt-2 w-full py-1 text-xs text-white bg-gray-500 rounded hover:bg-gray-600"
              onClick={() => setShowAddressModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default PlaceOrderPage;
