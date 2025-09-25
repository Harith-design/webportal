import React, { useState } from "react";
import { Trash2, Search } from "lucide-react";
import { getItems } from "../services/api"; // ✅ updated getItems(search, skip, top)
import "./OrderForm.css";

function PlaceOrderPage() {
  const [activeTab, setActiveTab] = useState("contents");

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
      unitPrice: "0.00",
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
      unitPrice: "0.00",
      weight: "",
      totalWeight: "0.00",
      lineTotal: "0.00",
      taxCode: "",
      active: false,
    },
  ]);

  // dropdown options per row
  const [itemOptions, setItemOptions] = useState({});

  const handleChange = (index, field, value) => {
    const updated = [...rows];
    updated[index][field] = value;

    if (field === "quantity" || field === "unitPrice") {
      const qty = parseFloat(updated[index].quantity) || 0;
      const price = parseFloat(updated[index].unitPrice) || 0;
      updated[index].lineTotal = (qty * price).toFixed(2);
    }

    setRows(updated);
  };

  // ✅ Option B: Always keep one inactive row at the bottom
  const activateRow = (index) => {
    setRows((prevRows) => {
      const updated = prevRows.map((row, i) =>
        i === index ? { ...row, active: true } : row
      );

      // If the last row is active, add one inactive row
      if (updated[updated.length - 1].active) {
        updated.push({
          product: "",
          description: "",
          quantity: "",
          unitPrice: "0.00",
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

  // ✅ Prevent deleting the last inactive row
  const handleDelete = (index) => {
    setRows((prevRows) => {
      if (!prevRows[index].active) return prevRows; // don't delete inactive row
      const updated = prevRows.filter((_, i) => i !== index);

      // Ensure at least one inactive row exists
      if (!updated.some((row) => row.active === false)) {
        updated.push({
          product: "",
          description: "",
          quantity: "",
          unitPrice: "0.00",
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

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Order submitted:", order, rows);
    alert("Order submitted! Check console for details.");
  };

  const orderTotal = rows
    .reduce((sum, row) => sum + parseFloat(row.lineTotal || 0), 0)
    .toFixed(2);

  // ✅ fetch items from SAP as user types
  const handleSearch = async (index, query) => {
    handleChange(index, "product", query);

    if (query.length < 2) return; // wait until user types at least 2 chars

    try {
      const items = await getItems(query, 0, 20); // fetch top 20 matches only
      setItemOptions((prev) => ({ ...prev, [index]: items }));
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  // ✅ when selecting an item
  const handleSelectItem = (index, item) => {
    const updated = [...rows];
    updated[index].product = item.ItemCode;
    updated[index].description = item.ItemName;
    updated[index].unitPrice = item.Price || "0.00"; // extend later if SAP returns price
    updated[index].weight = item.Weight || "0.00";
    setRows(updated);

    // clear dropdown
    setItemOptions((prev) => ({ ...prev, [index]: [] }));
  };

  return (
    <div className="max-w-full mx-auto p-6 rounded-xl shadow-md order-form-page w-full bg-white">
       {/* Flex container: form left, box right */}
        {/* First Section */}
        <div className="grid grid-cols-3 gap-6 p-4 rounded-lg">
          {/* Form (left) */}
          <form onSubmit={handleSubmit} className="col-span-2 grid grid-cols-2 gap-6">
            {/* Delivery Date */}
            <div className="flex items-center gap-4">
              <label className="w-[120px] text-xs">Delivery Date</label>
              <input
                type="date"
                name="deliveryDate"
                value={order.deliveryDate}
                onChange={(e) => setOrder({ ...order, [e.target.name]: e.target.value })}
                className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs"
                required
              />
            </div>

            {/* PO No */}
            <div className="flex items-center gap-4">
              <label className="w-[120px] text-xs">PO No.</label>
              <input
                type="text"
                name="ponum"
                value={order.ponum}
                onChange={(e) => setOrder({ ...order, [e.target.name]: e.target.value })}
                className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs"
                required
              />
            </div>

            {/* FOB Point */}
            <div className="flex items-center gap-4">
              <label className="w-[120px] text-xs">FOB Point</label>
              <input
                type="text"
                nB Pointame="ponum"
                value={order.ponum}
                onChange={(e) => setOrder({ ...order, [e.target.name]: e.target.value })}
                className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs"
                required
              />
            </div>

            {/* Freight Terms */}
            <div className="flex items-center gap-4">
              <label className="w-[120px] text-xs">Freight Terms</label>
              <input
                type="text"
                name="ponum"
                value={order.ponum}
                onChange={(e) => setOrder({ ...order, [e.target.name]: e.target.value })}
                className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs"
                required
              />
            </div>
          </form>
        </div>


        {/* Tabs */}
        {/* Heading Second Section */}
        <div className="border-b mb-4 mt-6 flex text-sm">
          <button
            type="button"
            onClick={() => setActiveTab("contents")}
            className={`px-4 py-2 rounded-t-md text-xs font-medium ${
              activeTab === "contents"
                ? "bg-blue-600 text-white border-x border-t border-gray-300 -mb-px"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            Contents
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("logistics")}
            className={`px-4 py-2 rounded-t-md text-xs font-medium ${
              activeTab === "logistics"
                ? "bg-blue-600 text-white border-x border-t border-gray-300 -mb-px"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            Logistics
          </button>
        </div>

        {/* Tab Content */}
        {/* Scrollable Table */}
        {/* Second Section */}
        {activeTab === "contents" && (
         <div className="grid grid-cols-1 lg:grid-cols-1 gap-6"> 
          <div className="p-6 rounded-xl shadow-md bg-white overflow-x-auto">
            <div className="min-w-[1200px]">
                <table className="table-auto w-full border-collapse ">
                    <thead>
                        <tr className="text-xs font-semibold border-b text-center align-middle">
                          <th className="px-2 py-2 text-left w-2/12">Item No.</th>
                          <th className="px-2 py-2 text-left w-2/12">Item Description</th>
                          <th className="px-2 py-2 w-1/12">Quantity</th>
                          <th className="px-2 py-2 w-1/12">Unit Price</th>
                          <th className="px-2 py-2 w-2/12">Weight</th>
                          <th className="px-2 py-2 w-1/12">Total Weight</th>
                          <th className="px-2 py-2 w-1/12">Line Total</th>
                          <th className="px-2 py-2 min-w-[120px]">Tax Code</th>
                          <th className="px-2 py-2 w-1/12">Delete</th>
                        </tr>
                    </thead>
                    <tbody className="text-xs">
                      {rows.map((row, index) => {
                        const isActive = row.active;
                        const inputBase =
                          "w-full box-border border rounded px-2 py-1 text-xs";
                        const inputActive =
                          "bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400";
                        const inputInactive = "cursor-pointer placeholder-gray-300";

                        const inputClass = `${inputBase} ${isActive ? inputActive : inputInactive}`;
                        return (
                          <tr
                            key={index}
                            className={`text-center align-middle ${
                              isActive ? "bg-white text-black" : "text-gray-400"
                            }`}
                          >
                            {/* Item No */}
                            <td className="px-2 py-2 text-left">
                              <div className="relative">
                                <input
                                  type="text"
                                  placeholder="Search"
                                  value={row.product}
                                  onChange={(e) => handleChange(index, "product", e.target.value)}
                                  onFocus={() => activateRow(index)}
                                  readOnly={!isActive}
                                  className={`${inputClass} pl-2 pr-8`}
                                />
                                <span
                                  className={`absolute right-2 top-1/2 -translate-y-1/2 ${
                                    isActive ? "text-gray-400" : "text-gray-300"
                                  }`}
                                >
                                  <Search size={14} />
                                </span>
                              </div>
                            </td>

                            {/* Item Description */}
                            <td className="px-2 py-2 text-left">
                              <div className="relative">
                                <input
                                  type="text"
                                  placeholder="Search"
                                  value={row.description}
                                  onChange={(e) =>
                                    handleChange(index, "description", e.target.value)
                                  }
                                  onFocus={() => activateRow(index)}
                                  readOnly={!isActive}
                                  className={`${inputClass} pl-2 pr-8`}
                                />
                                <span
                                  className={`absolute right-2 top-1/2 -translate-y-1/2 ${
                                    isActive ? "text-gray-400" : "text-gray-300"
                                  }`}
                                >
                                  <Search size={14} />
                                </span>
                              </div>
                            </td>

                            {/* Quantity */}
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                placeholder="No."
                                value={row.quantity}
                                onChange={(e) => handleChange(index, "quantity", e.target.value)}
                                onFocus={() => activateRow(index)}
                                readOnly={!isActive}
                                className={inputClass}
                              />
                            </td>

                            {/* Unit Price */}
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                placeholder="0.00"
                                value={row.unitPrice}
                                onChange={(e) => handleChange(index, "unitPrice", e.target.value)}
                                onFocus={() => activateRow(index)}
                                readOnly={!isActive}
                                className={inputClass}
                              />
                            </td>

                            {/* Weight */}
                            <td className="px-2 py-2 text-left">
                              <div className="relative">
                                <input
                                  type="text"
                                  placeholder="Search"
                                  value={row.weight}
                                  onChange={(e) => handleChange(index, "weight", e.target.value)}
                                  onFocus={() => activateRow(index)}
                                  readOnly={!isActive}
                                  className={`${inputClass} pl-2 pr-8`}
                                />
                                <span
                                  className={`absolute right-2 top-1/2 -translate-y-1/2 ${
                                    isActive ? "text-gray-400" : "text-gray-300"
                                  }`}
                                >
                                  <Search size={14} />
                                </span>
                              </div>
                            </td>

                            {/* Total Weight */}
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                placeholder="0.00"
                                value={row.totalWeight}
                                onChange={(e) => handleChange(index, "totalWeight", e.target.value)}
                                onFocus={() => activateRow(index)}
                                readOnly={!isActive}
                                className={inputClass}
                              />
                            </td>

                            {/* Line Total */}
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                placeholder="0.00"
                                value={row.lineTotal}
                                onChange={(e) => handleChange(index, "lineTotal", e.target.value)}
                                onFocus={() => activateRow(index)}
                                readOnly={!isActive}
                                className={inputClass}
                              />
                            </td>

                            {/* Tax Code */}
                            <td className="px-2 py-2">
                              <select
                                name="taxCode"
                                value={row.taxCode}
                                onChange={(e) => handleChange(index, "taxCode", e.target.value)}
                                className={inputClass}
                              >
                                <option value="code1">Tax Code 1</option>
                                <option value="code2">Tax Code 2</option>
                                <option value="code3">Tax Code 3</option>
                              </select>
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
                
            {/* Third Section */}
            {/* Order Total */}
            <div className="flex justify-end mt-2 pr-4">
              <p className="text-sm">
                Total Order: <span className="ml-2">RM {orderTotal}</span>
              </p>
            </div>
          </div>
        )}

        {activeTab === "logistics" && (
          <div className="p-4">
            <div className="grid grid-cols-2 gap-6">
              {/* Left side: Ship To + Bill To */}
              <div className="space-y-4">
                {/* Ship To */}
                <div className="flex items-center gap-4">
                  <label className="w-[80px] text-xs">Ship To</label>
                  <select
                    name="shippingAddress"
                    value={order.shippingAddress}
                    onChange={(e) =>
                      setOrder({ ...order, [e.target.name]: e.target.value })
                    }
                    className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs"
                  >
                    <option value="">Select Ship To</option>
                    <option value="Warehouse A">Warehouse A</option>
                    <option value="Warehouse B">Warehouse B</option>
                    <option value="Warehouse C">Warehouse C</option>
                  </select>
                </div>

                {/* Bill To */}
                <div className="flex items-center gap-4">
                  <label className="w-[80px] text-xs">Bill To</label>
                  <select
                    name="billingAddress"
                    value={order.billingAddress}
                    onChange={(e) =>
                      setOrder({ ...order, [e.target.name]: e.target.value })
                    }
                    className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs"
                  >
                    <option value="">Select Bill To</option>
                    <option value="Head Office">Head Office</option>
                    <option value="Finance Dept">Finance Dept</option>
                    <option value="Branch Office">Branch Office</option>
                  </select>
                </div>
              </div>

              {/* Right side: Preview Box (same style as Section 1) */}
              <div className="col-span-1 p-4 border rounded-lg shadow-sm bg-gray-50">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold mb-1">Shipping Address</p>
                        <p className="text-xs">{order.shippingAddress || "Select from form"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold mb-1">Billing Address</p>
                        <p className="text-xs">{order.billingAddress || "Select from form"}</p>
                      </div>
                    </div>
                  </div>
            </div>
          </div>
        )}


        {/* Fourth Section */}
        {/* Submit Button */}
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
