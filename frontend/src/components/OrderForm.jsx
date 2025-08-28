import React, { useState } from "react";
import { Trash2, Search } from "lucide-react";
import "./OrderForm.css"; // import your CSS

function PlaceOrderPage() {
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
    <div className="p-6 bg-white rounded-xl shadow-md order-form-page">
      {/* Flex container: form left, box right */}
      <div className="flex justify-between gap-8">
        {/* Form (left) */}
        <form onSubmit={handleSubmit} className="space-y-4 flex-1">
          {/* Requested Delivery Date */}
          <div className="flex items-center gap-4">
            <label className="min-w-[150px] text-xs">Requested Delivery Date</label>
            <input
              type="date"
              name="deliveryDate"
              value={order.deliveryDate}
              onChange={(e) => setOrder({ ...order, [e.target.name]: e.target.value })}
              className="flex-1 min-w-[250px] border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs"
              required
            />
          </div>

          {/* PO No */}
          <div className="flex items-center gap-4 w-80">
            <label className="min-w-[150px] text-xs">PO No.</label>
            <input
              type="text"
              name="ponum"
              value={order.ponum}
              onChange={(e) => setOrder({ ...order, [e.target.name]: e.target.value })}
              className="flex-1 min-w-[250px] border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs"
              required
            />
          </div>

          {/* Billing Address */}
          <div className="flex items-center gap-4 w-80">
            <label className="min-w-[150px] text-xs">Billing Address</label>
            <select
              name="billingAddress"
              value={order.billingAddress}
              onChange={(e) => setOrder({ ...order, [e.target.name]: e.target.value })}
              className="flex-1 min-w-[250px] border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs"
            >
              <option value="address1">Address 1</option>
              <option value="address2">Address 2</option>
              <option value="address3">Address 3</option>
            </select>
          </div>

          {/* Shipping Address */}
          <div className="flex items-center gap-4 w-80">
            <label className="min-w-[150px] text-xs">Shipping Address</label>
            <select
              name="shippingAddress"
              value={order.shippingAddress}
              onChange={(e) => setOrder({ ...order, [e.target.name]: e.target.value })}
              className="flex-1 min-w-[250px] border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs"
            >
              <option value="address1">Address 1</option>
              <option value="address2">Address 2</option>
              <option value="address3">Address 3</option>
            </select>
          </div>
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

      {/* Table */}
      <div className="bg-white p-4 rounded-xl shadow-md overflow-x-auto mt-6">
        <table className="table-auto w-full border-collapse OrderForm">
          <thead>
            <tr className="text-xs font-semibold border-b text-center align-middle">
              <th className="px-4 py-2 text-left">Product Lookup</th>
              <th className="px-4 py-2">Catalogue</th>
              <th className="px-4 py-2">Quantity</th>
              <th className="px-4 py-2">Item Price</th>
              <th className="px-4 py-2">Line Total</th>
              <th className="px-4 py-2">Delete</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {rows.map((row, index) => (
              <tr
                key={index}
                className={`text-center align-middle ${
                  row.active ? "bg-white text-black" : "text-gray-400"
                }`}
              >
                {/* Product Lookup */}
                <td className="px-4 py-2 text-left">
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
                <td className="px-4 py-2">
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
                </td>

                {/* Quantity */}
                <td className="px-4 py-2">
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
                <td className="w-1/6 px-4 py-2">{row.price}</td>

                {/* Line Total */}
                <td className="w-1/6 px-4 py-2">{row.total}</td>

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
  );
}

export default PlaceOrderPage;
