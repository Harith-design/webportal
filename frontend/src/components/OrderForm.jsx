import React, { useState } from "react";
import { Trash2, Search } from "lucide-react";
import "./OrderForm.css";

function PlaceOrderPage() {
  const [activeTab, setActiveTab] = useState("contents");

  const [order, setOrder] = useState({
    ponum: "",
    deliveryDate: "",
    fobPoint: "",
    freightTerms: "",
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
      totalWeight: "",
      lineTotal: "0.00",
      taxCode: "code1",
    },
  ]);

  const handleChange = (index, field, value) => {
    const updated = [...rows];
    updated[index][field] = value;

    const qty = parseFloat(updated[index].quantity) || 0;
    const price = parseFloat(updated[index].unitPrice) || 0;
    updated[index].lineTotal = (qty * price).toFixed(2);

    // Add a new empty row only if editing the last row
    if (
      index === rows.length - 1 &&
      Object.values(updated[index]).some((v) => v !== "" && v !== "0.00")
    ) {
      updated.push({
        product: "",
        description: "",
        quantity: "",
        unitPrice: "0.00",
        weight: "",
        totalWeight: "",
        lineTotal: "0.00",
        taxCode: "code1",
      });
    }

    setRows(updated);
  };

  const handleDelete = (index) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Order submitted:", order, rows);
    alert("Order submitted! Check console for details.");
  };

  const orderTotal = rows.reduce(
    (sum, row) => sum + parseFloat(row.lineTotal || 0),
    0
  ).toFixed(2);

  return (
    <div className="flex justify-center">
      <div className="p-6 rounded-xl shadow-md order-form-page max-w-[80vw] w-full bg-red-200">
        {/* Form and addresses */}
        <div className="flex justify-between gap-32 mx-auto">
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6 flex-1">
            {[
              { label: "Delivery Date", name: "deliveryDate", type: "date" },
              { label: "PO No.", name: "ponum", type: "text" },
              { label: "FOB Point", name: "fobPoint", type: "text" },
              { label: "Freight Terms", name: "freightTerms", type: "text" },
            ].map((field, i) => (
              <div className="flex items-center gap-4" key={i}>
                <label className="w-[120px] text-xs">{field.label}</label>
                <input
                  type={field.type}
                  name={field.name}
                  value={order[field.name]}
                  onChange={(e) =>
                    setOrder({ ...order, [e.target.name]: e.target.value })
                  }
                  className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs"
                  required
                />
              </div>
            ))}
          </form>

          {/* Addresses box */}
          <div className="w-1/3 p-4 border rounded-lg shadow-sm bg-gray-50">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold mb-1">Billing Address</p>
                <p className="text-xs">{order.billingAddress || "Select from form"}</p>
              </div>
              <div>
                <p className="text-sm font-semibold mb-1">Shipping Address</p>
                <p className="text-xs">{order.shippingAddress || "Select from form"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b mb-4 mt-6 flex text-sm">
          {["contents", "logistics"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-t-md text-xs font-medium ${
                activeTab === tab
                  ? "bg-blue-600 text-white border-x border-t border-gray-300 -mb-px"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "contents" && (
          <div className="bg-white rounded-xl shadow-md p-4 overflow-x-auto">
            <table className="table-auto border-collapse w-full bg-white min-w-max">
              <thead>
                <tr className="text-xs font-semibold border-b text-center align-middle">
                  {[
                    "Item No.",
                    "Item Description",
                    "Quantity",
                    "Unit Price",
                    "Weight",
                    "Total Weight",
                    "Line Total",
                    "Tax Code",
                    "Delete",
                  ].map((th, i) => (
                    <th key={i} className="px-2 py-2 text-left">
                      {th}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-xs">
                {rows.map((row, index) => (
                  <tr key={index} className="text-center align-middle bg-white text-black">
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        placeholder="Search"
                        value={row.product}
                        onChange={(e) => handleChange(index, "product", e.target.value)}
                        className="w-full box-border border rounded px-2 py-1 text-xs bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        placeholder="Search"
                        value={row.description}
                        onChange={(e) => handleChange(index, "description", e.target.value)}
                        className="w-full box-border border rounded px-2 py-1 text-xs bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        placeholder="0"
                        value={row.quantity}
                        onChange={(e) => handleChange(index, "quantity", e.target.value)}
                        className="w-full box-border border rounded px-2 py-1 text-xs"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        placeholder="0.00"
                        value={row.unitPrice}
                        onChange={(e) => handleChange(index, "unitPrice", e.target.value)}
                        className="w-full box-border border rounded px-2 py-1 text-xs"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        placeholder="0"
                        value={row.weight}
                        onChange={(e) => handleChange(index, "weight", e.target.value)}
                        className="w-full box-border border rounded px-2 py-1 text-xs"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        placeholder="0.00"
                        value={row.totalWeight}
                        onChange={(e) => handleChange(index, "totalWeight", e.target.value)}
                        className="w-full box-border border rounded px-2 py-1 text-xs"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        placeholder="0.00"
                        value={row.lineTotal}
                        readOnly
                        className="w-full box-border border rounded px-2 py-1 text-xs bg-gray-100"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <select
                        value={row.taxCode}
                        onChange={(e) => handleChange(index, "taxCode", e.target.value)}
                        className="w-full box-border border rounded px-2 py-1 text-xs"
                      >
                        <option value="code1">Tax Code 1</option>
                        <option value="code2">Tax Code 2</option>
                        <option value="code3">Tax Code 3</option>
                      </select>
                    </td>
                    <td className="px-2 py-2 flex justify-center items-center">
                      <button
                        type="button"
                        onClick={() => handleDelete(index)}
                        className="p-2 text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Order Total */}
        <div className="flex justify-end mt-6 pr-4">
          <p className="text-sm">
            Total Order: <span className="ml-2">RM {orderTotal}</span>
          </p>
        </div>

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
    </div>
  );
}

export default PlaceOrderPage;
