import React, { useState, useRef, useEffect } from "react";
import { Trash2, Search, Loader2 } from "lucide-react";
import { getItems } from "../services/api";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";
import axios from "axios";
import "./OrderForm.css";

function PlaceOrderPage() {
  const [order, setOrder] = useState({
    ponum: "",
    deliveryDate: "",
    billingAddress: "",
    shippingAddress: "",
  });

  const [rows, setRows] = useState([
    {
      product: "",
      description: "",
      quantity: "",
      unitPrice: "",
      weight: "",
      totalWeight: "0.00",
      lineTotal: "0.00",
      taxCode: "",
      active: true,
    },
    {
      product: "",
      description: "",
      quantity: "",
      unitPrice: "",
      weight: "",
      totalWeight: "0.00",
      lineTotal: "0.00",
      taxCode: "",
      active: false,
    },
  ]);

  const [itemOptions, setItemOptions] = useState({});
  const [loadingRow, setLoadingRow] = useState(null);
  const [orderTotal, setOrderTotal] = useState("0.00");
  const [userCompany, setUserCompany] = useState({ cardcode: "", cardname: "" });
  const searchTimers = useRef({});

  // 🔁 Auto-calc order total
  useEffect(() => {
    const total = rows.reduce(
      (sum, row) => sum + parseFloat(row.lineTotal || 0),
      0
    );
    setOrderTotal(total.toFixed(2));
  }, [rows]);

  // 🔹 Fetch user's company info from backend on load
  useEffect(() => {
    const fetchUserCompany = async () => {
      try {
        var token = localStorage.getItem("token");
        if(!token){
          token = sessionStorage.getItem("token");
        }

        const apiUrl = process.env.REACT_APP_BACKEND_API_URL;
        const res = await axios.get(
          // "http://192.168.100.189:8000/api/user/company",
          `${apiUrl}/api/user/company`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log(res);
        if (res.data && res.data.cardcode && res.data.cardname) {
          setUserCompany({
            cardcode: res.data.cardcode,
            cardname: res.data.cardname,
          });
        } else {
          toast.error("Company info not found. Please update your profile.");
        }
      } catch (err) {
        console.error("Failed to fetch company info:", err);
        toast.error("Unable to get company info.");
      }
    };

    fetchUserCompany();
  }, []);

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
          totalWeight: "0.00",
          lineTotal: "0.00",
          taxCode: "",
          active: false,
        });
      }
      return updated;
    });
  };

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
          totalWeight: "0.00",
          lineTotal: "0.00",
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

  const handleSelectItem = (index, item) => {
    const updated = [...rows];
    updated[index].product = item.ItemCode || "";
    updated[index].description = item.ItemName || item.Description || "";
    updated[index].unitPrice = "";
    updated[index].weight = "";
    setRows(updated);
    setItemOptions((prev) => ({ ...prev, [index]: [] }));
  };

  // ✅ Submit order to backend (real SAP creation)
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");

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
        // "http://192.168.100.189:8000/api/sap/sales-orders",
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
        toast.success(`✅ Sales Order Created! DocNum: ${res.data.data.DocNum}`);
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
      console.error("❌ Failed to submit order:", err);
      toast.error(
        err.response?.data?.message ||
          "Something went wrong while submitting the order."
      );
    }
  };

  return (
    <div className="max-w-full mx-auto p-6 rounded-xl shadow-md order-form-page w-full bg-white">
      {/* Header */}
      <div className="flex justify-between py-2 rounded-lg gap-x-10">
        <form onSubmit={handleSubmit} className="flex-1 grid grid-cols-2 gap-6">
          <div className="flex items-center gap-4">
            <label className="w-[190px] text-xs">Requested Delivery Date</label>
            <input
              type="date"
              name="deliveryDate"
              value={order.deliveryDate}
              onChange={(e) =>
                setOrder({ ...order, [e.target.name]: e.target.value })
              }
              className="w-2/3 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs"
              required
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="w-[50px] text-xs">Ship To</label>
            <select
              name="shippingAddress"
              value={order.shippingAddress}
              onChange={(e) =>
                setOrder({ ...order, [e.target.name]: e.target.value })
              }
              className="w-2/3 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs"
            >
              <option value="">Select Ship To</option>
              <option value="Warehouse A">Warehouse A</option>
              <option value="Warehouse B">Warehouse B</option>
              <option value="Warehouse C">Warehouse C</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <label className="w-[190px] text-xs">PO Reference</label>
            <span className="w-2/3 px-3 py-2 text-xs border rounded-lg bg-gray-100 text-gray-100">
              {order.poref || "—"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <label className="w-[50px] text-xs">Bill To</label>
            <select
              name="billingAddress"
              value={order.billingAddress}
              onChange={(e) =>
                setOrder({ ...order, [e.target.name]: e.target.value })
              }
              className="w-2/3 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs"
            >
              <option value="">Select Bill To</option>
              <option value="Head Office">Head Office</option>
              <option value="Finance Dept">Finance Dept</option>
              <option value="Branch Office">Branch Office</option>
            </select>
          </div>
        </form>

        {/* Preview */}
        <div className="flex-1 p-4 border rounded-lg shadow-sm bg-gray-50 max-w-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold mb-1">Shipping Address</p>
              <p className="text-xs">
                {order.shippingAddress || "Select from form"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold mb-1">Billing Address</p>
              <p className="text-xs">
                {order.billingAddress || "Select from form"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <div className="p-6 rounded-xl shadow-md bg-white overflow-x-auto">
          <div className="min-w-[1200px]">
            <table className="table-auto w-full border-collapse">
              <thead>
                <tr className="text-xs font-semibold border-b text-center align-middle">
                  <th className="px-2 py-2 text-left w-2/12">Item No.</th>
                  <th className="px-2 py-2 text-left w-2/12">Item Description</th>
                  <th className="px-2 py-2 w-1/12">Quantity</th>
                  <th className="px-2 py-2 w-1/12">Unit Price</th>
                  <th className="px-2 py-2 w-1/12">Weight</th>
                  <th className="px-2 py-2 w-1/12">Total Weight</th>
                  <th className="px-2 py-2 w-1/12">Line Total</th>
                  <th className="px-2 py-2 w-1/12">Delete</th>
                </tr>
              </thead>

              <tbody className="text-xs">
                {rows.map((row, index) => {
                  const isActive = row.active;
                  const items = itemOptions[index] || [];
                  const isLoading = loadingRow === index;

                  const inputBase =
                    "w-full box-border border rounded px-2 py-1 text-xs";
                  const inputActive =
                    "bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400";
                  const inputInactive = "placeholder-gray-300";
                  const inputClass = `${inputBase} ${
                    isActive ? inputActive : inputInactive
                  }`;

                  return (
                    <tr
                      key={index}
                      className={`text-center align-middle ${
                        isActive ? "bg-white text-black" : "text-gray-400"
                      }`}
                    >
                      {/* Item Code Search */}
                      <td className="px-2 py-2 text-left">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder={
                              isActive ? "Search item" : "Click to add an item"
                            }
                            value={row.product}
                            onChange={(e) => handleSearch(index, e.target.value)}
                            onFocus={() => activateRow(index)}
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
                            <ul className="absolute z-10 bg-white border rounded shadow-md w-full text-xs mt-1 max-h-40 overflow-y-auto">
                              {items.map((item) => (
                                <li
                                  key={item.ItemCode}
                                  onClick={() => handleSelectItem(index, item)}
                                  className="px-2 py-1 hover:bg-blue-100 cursor-pointer"
                                >
                                  {item.ItemCode} —{" "}
                                  {item.ItemName || item.Description}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </td>

                      {/* Description */}
                      <td className="px-2 py-2 text-left">
                        <input
                          type="text"
                          value={row.description}
                          onChange={(e) =>
                            handleChange(index, "description", e.target.value)
                          }
                          disabled={!isActive}
                          className={inputClass}
                        />
                      </td>

                      {/* Quantity */}
                      <td className="px-2 py-2">
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
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          placeholder="0.00"
                          value={row.unitPrice}
                          onChange={(e) =>
                            handleChange(index, "unitPrice", e.target.value)
                          }
                          disabled={!isActive}
                          className={inputClass}
                        />
                      </td>

                      {/* Weight */}
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          placeholder="0.00"
                          value={row.weight}
                          onChange={(e) =>
                            handleChange(index, "weight", e.target.value)
                          }
                          disabled={!isActive}
                          className={inputClass}
                        />
                      </td>

                      {/* Total Weight */}
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          value={row.totalWeight}
                          disabled
                          readOnly
                          className={`${inputBase} text-gray-400`}
                        />
                      </td>

                      {/* Line Total */}
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          value={row.lineTotal}
                          disabled
                          readOnly
                          className={`${inputBase} text-gray-400`}
                        />
                      </td>

                      {/* Delete */}
                      <td className="px-2 py-2 flex justify-center items-center">
                        <button
                          type="button"
                          onClick={() => isActive && handleDelete(index)}
                          disabled={!isActive}
                          className={`p-2 ${
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
      <div className="flex justify-end mt-6 pr-4">
        <p className="text-sm">
          Total Order: <span className="ml-2">RM {orderTotal}</span>
        </p>
      </div>

      <div className="flex justify-end mt-6">
        <button
          type="submit"
          onClick={handleSubmit}
          className="bg-blue-600 text-white text-sm py-2 px-4 rounded-lg hover:bg-blue-700 transition"
        >
          Submit Order
        </button>
      </div>
    </div>
  );
}

export default PlaceOrderPage;
