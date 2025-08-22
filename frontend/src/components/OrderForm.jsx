import React, { useState, useEffect } from "react";
import "./AuthOrder.css";

function OrderForm() {
  const [header, setHeader] = useState({
    customer: "",
    orderDate: new Date().toISOString().split("T")[0],
    deliveryDate: "",
    comments: "",
  });
  const [lines, setLines] = useState([{ itemCode: "", description: "", quantity: 1, price: 0, warehouse: "", lineTotal: 0 }]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("token")) window.location.href = "/login";
  }, []);

  const handleHeaderChange = (e) => setHeader({ ...header, [e.target.name]: e.target.value });

  const handleLineChange = (index, e) => {
    const newLines = [...lines];
    newLines[index][e.target.name] = e.target.value;
    if (e.target.name === "quantity" || e.target.name === "price") {
      newLines[index].lineTotal = (parseFloat(newLines[index].quantity) || 0) * (parseFloat(newLines[index].price) || 0);
    }
    setLines(newLines);
  };

  const addLine = () => setLines([...lines, { itemCode: "", description: "", quantity: 1, price: 0, warehouse: "", lineTotal: 0 }]);
  const removeLine = (index) => setLines(lines.filter((_, i) => i !== index));

  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const tax = subtotal * 0.1;
  const grandTotal = subtotal + tax;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://127.0.0.1:8000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ header, lines }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage("✅ Order placed successfully!");
        setHeader({ customer: "", orderDate: new Date().toISOString().split("T")[0], deliveryDate: "", comments: "" });
        setLines([{ itemCode: "", description: "", quantity: 1, price: 0, warehouse: "", lineTotal: 0 }]);
      } else setMessage("❌ " + (data.message || "Order failed"));
    } catch (error) {
      setMessage("⚠️ " + error.message);
    }
  };

  return (
    <div className="relative min-h-screen flex justify-center items-start p-8 bg-dark-gradient overflow-hidden">
      {/* Floating particles */}
      <div className="absolute w-48 h-48 bg-gold/30 rounded-full animate-float top-20 left-10"></div>
      <div className="absolute w-64 h-64 bg-gold/20 rounded-full animate-float-slow bottom-10 right-20"></div>

      <form className="relative order-glass-card p-8 text-white" onSubmit={handleSubmit}>
        <h2 className="text-4xl font-bold mb-6 text-center text-neon-purple">Create Sales Order</h2>

        {/* Header */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {["customer","orderDate","deliveryDate","comments"].map((name) => (
            <div key={name} className="flex flex-col">
              <label className="mb-1 text-sm font-semibold text-gray-300">{name.charAt(0).toUpperCase() + name.slice(1)}</label>
              <input type={name==="orderDate"||name==="deliveryDate"?"date":"text"} name={name} value={header[name]} onChange={handleHeaderChange} className="glass-input" required={name==="customer"||name==="orderDate"} />
            </div>
          ))}
        </div>

        {/* Order Lines */}
        <div className="overflow-x-auto mb-4">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gold/30 text-white">
                {["Item Code","Description","Qty","Price","Warehouse","Line Total","Action"].map((col) => <th key={col} className="p-2 text-left">{col}</th>)}
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => (
                <tr key={idx} className="hover:bg-gold/10 transition-colors">
                  <td className="p-2"><input type="text" name="itemCode" value={line.itemCode} onChange={(e) => handleLineChange(idx,e)} className="glass-input" required/></td>
                  <td className="p-2"><input type="text" name="description" value={line.description} onChange={(e) => handleLineChange(idx,e)} className="glass-input"/></td>
                  <td className="p-2"><input type="number" name="quantity" value={line.quantity} onChange={(e) => handleLineChange(idx,e)} className="glass-input" min="1" required/></td>
                  <td className="p-2"><input type="number" name="price" value={line.price} onChange={(e) => handleLineChange(idx,e)} className="glass-input" min="0" required/></td>
                  <td className="p-2"><input type="text" name="warehouse" value={line.warehouse} onChange={(e) => handleLineChange(idx,e)} className="glass-input"/></td>
                  <td className="p-2 text-right font-semibold">{line.lineTotal.toFixed(2)}</td>
                  <td className="p-2"><button type="button" onClick={()=>removeLine(idx)} className="btn-remove">Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button type="button" onClick={addLine} className="btn-add mb-4">+ Add Item</button>

        {/* Totals */}
        <div className="flex justify-end gap-8 mt-4 mb-6 font-semibold">
          <div>Subtotal: {subtotal.toFixed(2)}</div>
          <div>Tax: {tax.toFixed(2)}</div>
          <div className="text-neon-purple text-lg">Grand Total: {grandTotal.toFixed(2)}</div>
        </div>

        <button type="submit" className="btn-submit w-full">Submit Order</button>

        {message && <p className="mt-3 text-center text-green-400">{message}</p>}
      </form>
    </div>
  );
}

export default OrderForm;
