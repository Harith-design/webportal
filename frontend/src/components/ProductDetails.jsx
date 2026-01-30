import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Plus, Minus } from "lucide-react";
import { useCart } from "../context/CartContext"; // import context


function ProductDetails() {
  const { id } = useParams();

  const product = {
    name: id,
    image: "https://via.placeholder.com/500x500?text=Product+Image",
    sku: ["B287-232-3000N", "B287-232-3000NA", "B287-232-3250NA"],
    widths: ["232 mm", "232 mm", "250 mm"],
    lengths: ["3000 mm", "3000 mm", "3250 mm"],
    thicknesses: ["8 mm", "10 mm", "12 mm"],
  };

  // ✅ state
  const [sku, setSKU] = useState(product.sku[0]);
  const [width, setWidth] = useState(product.widths[0]);
  const [length, setLength] = useState(product.lengths[0]);
  const [thickness, setThickness] = useState(product.thicknesses[0]);
  const [qty, setQty] = useState(1);
  const numericQty = Number(qty) || 0;
  const [weight, setWeight] = useState("");
  const totalWeight = numericQty * (Number(weight) || 0);

  const { addToCart } = useCart(); // get addToCart from context


   const handleSubmit = () => {
    const item = {
      compound: product.name,
      sku,
      width,
      length,
      thickness,
      quantity: Number(qty),
      weight: Number(weight) || 0,
      totalWeight: totalWeight,
    };

    addToCart(item); // add item to cart
    console.log("Added to cart:", item);
  };


  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto p-8">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

          {/* LEFT */}
          <div className="flex items-center justify-center">
            <img
              src={product.image}
              alt={product.name}
              className="rounded-xl shadow-md object-contain max-h-[500px]"
            />
          </div>

          {/* RIGHT */}
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">{product.name}</h1>

            {/* form */}
            <div className="space-y-4 text-xs">

             {/* SKU Code */}
              <div>
                <label className="block text-gray-500 mb-1">SKU No</label>
                <select
                  value={width}
                  onChange={(e) => setSKU(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2"
                >
                  {product.sku.map((w, i) => (
                    <option key={i}>{w}</option>
                  ))}
                </select>
              </div>

              {/* Width */}
              <div>
                <label className="block text-gray-500 mb-1">Width</label>
                <select
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2"
                >
                  {product.widths.map((w, i) => (
                    <option key={i}>{w}</option>
                  ))}
                </select>
              </div>

              {/* Length */}
              <div>
                <label className="block text-gray-500 mb-1">Length</label>
                <select
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2"
                >
                  {product.lengths.map((l, i) => (
                    <option key={i}>{l}</option>
                  ))}
                </select>
              </div>

              {/* Thickness */}
              <div>
                <label className="block text-gray-500 mb-1">Thickness</label>
                <select
                  value={thickness}
                  onChange={(e) => setThickness(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2"
                >
                  {product.thicknesses.map((t, i) => (
                    <option key={i}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Quantity + Weight side-by-side */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div>
                    <label className="block text-gray-500 mb-1">Quantity</label>

                    <div className="flex items-center border rounded-xl overflow-hidden shadow-sm w-full bg-white">

                        {/* minus */}
                        <button
                        type="button"
                        onClick={() => setQty((q) => Math.max(1, q - 1))}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-400 transition"
                        >
                        <Minus size={16} className="text-white"/>
                        </button>

                        {/* number */}
                        <input
                        type="number"
                        min="1"
                        value={qty}
                        onChange={(e) => setQty(e.target.value)} // keep as string
                        className="w-full text-center outline-none"
                        />

                        {/* plus */}
                        <button
                        type="button"
                        onClick={() => setQty((q) => q + 1)}
                        className="px-3 py-2 bg-blue-600 hover:bg-gray-200 transition"
                        >
                        <Plus size={16} className="text-white"/>
                        </button>

                    </div>
                </div>

                </div>

                {/* Weight (kg) */}
                <div>
                  <label className="block text-gray-500 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full border rounded-xl px-3 py-2"
                  />
                </div>

                

            </div>

            {/* Total Weight (kg) */}
                <div>
                    <label className="block text-gray-500 mb-1">Total Weight (kg)</label>
                    <input
                        type="number"
                        value={totalWeight}
                        readOnly
                        className="w-full border rounded-xl px-3 py-2 bg-gray-100 font-semibold cursor-not-allowed"
                    />
                    </div>

              {/* Button */}
              <button
                onClick={handleSubmit}
                className="w-full bg-blue-600 text-white text-sm rounded-xl py-3 font-semibold hover:bg-blue-700 transition"
              >
                Add to Cart
              </button>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;
