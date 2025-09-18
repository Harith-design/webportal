import React, { useState } from "react";
import { Trash2, Search } from "lucide-react";
import "./OrderForm.css"; // import your CSS

function PlaceOrderPage() {

  const [activeTab, setActiveTab] = useState("contents");

  const [order, setOrder] = useState({
    ponum: "",
    deliveryDate: "",
    billingAddress: "",
    shippingAddress: "",
  });

  // ✅ Rows state
  const [rows, setRows] = useState([
    { product: "", catalogue: "", quantity: "", price: "0.00", total: "0.00", active: true },
    { product: "", catalogue: "", quantity: "", price: "0.00", total: "0.00", active: false },
  ]);

  // ✅ Handle row edits
  const handleChange = (index, field, value) => {
    const updated = [...rows];
    updated[index][field] = value;

    // auto calculate line total
    if (field === "quantity" || field === "price") {
      const qty = parseFloat(updated[index].quantity) || 0;
      const price = parseFloat(updated[index].price) || 0;
      updated[index].total = (qty * price).toFixed(2);
    }

    setRows(updated);
  };

  // ✅ Activate row on focus
  const activateRow = (index) => {
    if (!rows[index].active) {
      const updated = [...rows];
      updated[index].active = true;
      setRows([
        ...updated,
        { product: "", catalogue: "", quantity: "", price: "", total: "", active: false },
      ]);
    }
  };

  // ✅ Delete row
  const handleDelete = (index) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  // ✅ Submit
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Order submitted:", order, rows);
    alert("Order submitted! Check console for details.");
  };

  const orderTotal = rows.reduce((sum, row) => sum + parseFloat(row.total || 0), 0).toFixed(2);


  return (
    // <div className="flex justify-center">
    <div className="p-6 rounded-xl shadow-md order-form-page w-full bg-white">
      {/* Flex container: form left, box right */}
      <div className="flex justify-between gap-32 mx-auto">
        {/* Form (left) */}
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6 flex-1">
          {/* Delivery Date */}
          <div className="flex items-center gap-4">
            <label className="min-w-[120px] text-xs">Delivery Date</label>
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
            <label className="min-w-[120px] text-xs">PO No.</label>
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
            <label className="min-w-[120px] text-xs">FOB Point</label>
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
            <label className="min-w-[120px] text-xs">Freight Terms</label>
            <input
              type="text"
              name="ponum"
              value={order.ponum}
              onChange={(e) => setOrder({ ...order, [e.target.name]: e.target.value })}
              className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs"
              required
            />
          </div>

          {/* Billing Address 
          <div className="flex items-center gap-4">
            <label className="min-w-[120px] text-xs">Billing Address</label>
            <select
              name="billingAddress"
              value={order.billingAddress}
              onChange={(e) => setOrder({ ...order, [e.target.name]: e.target.value })}
              className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs"
            >
              <option value="address1">Address 1</option>
              <option value="address2">Address 2</option>
              <option value="address3">Address 3</option>
            </select>
          </div>
          */}

          {/* Shipping Address 
          <div className="flex items-center gap-4">
            <label className="min-w-[120px] text-xs">Shipping Address</label>
            <select
              name="shippingAddress"
              value={order.shippingAddress}
              onChange={(e) => setOrder({ ...order, [e.target.name]: e.target.value })}
              className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs"
            >
              <option value="address1">Address 1</option>
              <option value="address2">Address 2</option>
              <option value="address3">Address 3</option>
            </select>
          </div>
          */}
        </form>


        {/* Right side: Addresses box */}
        <div className="w-96 p-4 border rounded-lg shadow-sm bg-gray-50">
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
      {activeTab === "contents" && (
  <div className="bg-white rounded-xl shadow-md p-4 overflow-x-auto">
    {/* Table */}
    <div className="min-w-[1200px]">
      <table className="table-auto border-collapse w-full bg-white">
        <thead>
          <tr className="text-xs font-semibold border-b text-center align-middle">
            <th className="px-4 py-2 text-left min-w-[180px]">Item No.</th>
            <th className="px-4 py-2 text-left min-w-[220px]">Item Description</th>
            <th className="px-4 py-2 min-w-[120px]">Quantity</th>
            <th className="px-4 py-2 min-w-[120px]">Unit Price</th>
            <th className="px-4 py-2 min-w-[120px]">Weight</th>
            <th className="px-4 py-2 min-w-[120px]">Total Weight</th>
            <th className="px-4 py-2 min-w-[120px]">Line Total</th>
            <th className="px-4 py-2 min-w-[120px]">Tax Code</th>
            <th className="px-4 py-2 min-w-[120px]">Delete</th>
          </tr>
        </thead>
        <tbody className="text-xs">
          {rows.map((row, index) => (
            <tr key={index} className={`text-center align-middle ${row.active ? "bg-white text-black" : "text-gray-400"}`}>
              {/* Item No */}
                              <td className="px-4 py-2 text-left min-w-[180px]">
                                <div className="relative">
                                  <input
                                    type="text"
                                    placeholder="Search"
                                    value={row.product}
                                    onChange={(e) => handleChange(index, "product", e.target.value)}
                                    onFocus={() => activateRow(index)}
                                    readOnly={!row.active}
                                     className={`w-full border rounded pl-2 pr-8 py-1 text-xs ${
                                      row.active
                                        ? "placeholder-gray-400 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                                        : "placeholder-gray-300 cursor-pointer"
                                    }`}
                                  />
                                  <span
                                    className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${
                                      row.active ? "text-gray-400" : "text-gray-300"
                                    }`}
                                  >
                                    <Search size={14} />
                                  </span>
                                </div>
                              </td>
              
                              {/* Item Description */}
                              <td className="px-4 py-2 text-left min-w-[180px]">
                                <div className="relative">
                                  <input
                                    type="text"
                                    placeholder="Search"
                                    value={row.product}
                                    onChange={(e) => handleChange(index, "product", e.target.value)}
                                    onFocus={() => activateRow(index)}
                                    readOnly={!row.active}
                                     className={`w-full border rounded pl-2 pr-8 py-1 text-xs ${
                                      row.active
                                        ? "placeholder-gray-400 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                                        : "placeholder-gray-300 cursor-pointer"
                                    }`}
                                  />
                                  <span
                                    className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${
                                      row.active ? "text-gray-400" : "text-gray-300"
                                    }`}
                                  >
                                    <Search size={14} />
                                  </span>
                                </div>
                              </td>
              
                              {/* Catalogue */}
                              {/* <td className="px-4 py-2">
                                <input
                                  type="text"
                                  value={row.catalogue}
                                  onChange={(e) => handleChange(index, "catalogue", e.target.value)}
                                  onFocus={() => activateRow(index)}
                                  readOnly={!row.active}
                                  className={`w-full border rounded px-2 py-1 text-xs ${
                                    row.active ? "bg-white focus:outline-none focus:ring-1 focus:ring-blue-400" : "cursor-pointer"
                                  }`}
                                />
                              </td> */}
              
                              {/* Quantity */}
                              <td className="px-4 py-2 min-w-[30px]">
                                <input
                                  type="number"
                                  placeholder="No."
                                  value={row.quantity}
                                  onChange={(e) => handleChange(index, "quantity", e.target.value)}
                                  onFocus={() => activateRow(index)}
                                  readOnly={!row.active}
                                  className={`w-1/3 border rounded px-2 py-1 text-xs ${
                                    row.active ? "placeholder-gray-400 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400" : "placeholder-gray-300 cursor-pointer"
                                  }`}
                                />
                              </td>
              
                              {/* Unit Price */}
                              <td className="px-4 py-2 min-w-[50px]">
                                <input
                                  type="number"
                                  placeholder="0.00"
                                  value={row.quantity}
                                  onChange={(e) => handleChange(index, "quantity", e.target.value)}
                                  onFocus={() => activateRow(index)}
                                  readOnly={!row.active}
                                  className={`w-1/3 border rounded px-2 py-1 text-xs ${
                                    row.active ? "placeholder-gray-400 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400" : "placeholder-gray-300 cursor-pointer"
                                  }`}
                                />
                              </td>
              
                              {/* Weight */}
                              <td className="px-4 py-2 text-left min-w-[20px]">
                                <div className="relative">
                                  <input
                                    type="text"
                                    placeholder="Search"
                                    value={row.product}
                                    onChange={(e) => handleChange(index, "product", e.target.value)}
                                    onFocus={() => activateRow(index)}
                                    readOnly={!row.active}
                                     className={`w-full border rounded pl-2 pr-8 py-1 text-xs ${
                                      row.active
                                        ? "placeholder-gray-400 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                                        : "placeholder-gray-300 cursor-pointer"
                                    }`}
                                  />
                                  <span
                                    className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${
                                      row.active ? "text-gray-400" : "text-gray-300"
                                    }`}
                                  >
                                    <Search size={14} />
                                  </span>
                                </div>
                              </td>
              
                              {/* Total Weight */}
                              <td className="px-4 py-2">
                                <input
                                  type="number"
                                  placeholder="0.00"
                                  value={row.quantity}
                                  onChange={(e) => handleChange(index, "quantity", e.target.value)}
                                  onFocus={() => activateRow(index)}
                                  readOnly={!row.active}
                                  className={`w-1/3 border rounded px-2 py-1 text-xs ${
                                    row.active ? "placeholder-gray-400 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400" : "placeholder-gray-300 cursor-pointer"
                                  }`}
                                />
                              </td>
              
              
                                  {/* Line Total */}
                              <td className="px-4 py-2">
                                <input
                                  type="number"
                                  placeholder="0.00"
                                  value={row.quantity}
                                  onChange={(e) => handleChange(index, "quantity", e.target.value)}
                                  onFocus={() => activateRow(index)}
                                  readOnly={!row.active}
                                  className={`w-1/3 border rounded px-2 py-1 text-xs ${
                                    row.active ? "placeholder-gray-400 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400" : "placeholder-gray-300 cursor-pointer"
                                  }`}
                                />
                              </td>
              
                              {/* Item Price */}
                              {/* <td className="px-4 py-2">
                                <input
                                  type="number"
                                  value={row.price}
                                  onChange={(e) => handleChange(index, "price", e.target.value)}
                                  onFocus={() => activateRow(index)}
                                  readOnly={!row.active}
                                  className={`w-1/3 border rounded px-2 py-1 text-xs ${
                                    row.active ? "bg-white focus:outline-none focus:ring-1 focus:ring-blue-400" : "cursor-pointer"
                                  }`}
                                />
                              </td> */}
                              {/* <td className="w-1/6 px-4 py-2">{row.price}</td> */}
              
                              {/* Line Total */}
                              {/* <td className="w-1/6 px-4 py-2">{row.total}</td> */}
              
                              {/* Tax Code  */}
                              <td className="px-4 py-2">
                                <select
                                  name="billingAddress"
                                  value={order.billingAddress}
                                  onChange={(e) => setOrder({ ...order, [e.target.name]: e.target.value })}
                                  className={`w-1/3 border rounded px-2 py-1 text-xs ${
                                    row.active ? "placeholder-gray-400 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400" : "placeholder-gray-300 cursor-pointer"
                                  }`}
                                >
                                  <option value="address1">Tax Code 1</option>
                                  <option value="address2">Tax Code 2</option>
                                  <option value="address3">Tax Code 3</option>
                                </select>
                              </td>
                             
              
                              {/* Delete */}
                              <td className="px-4 py-2 flex justify-center items-center">
                                <button
                                  type="button"
                                  onClick={() => row.active && handleDelete(index)}
                                  disabled={!row.active}
                                  className={`p-2 ${
                                    row.active
                                      ? "text-red-500 hover:text-red-700"
                                      : "text-gray-300 cursor-not-allowed"
                                  }`}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
  // </div>
  );
}

export default PlaceOrderPage;
