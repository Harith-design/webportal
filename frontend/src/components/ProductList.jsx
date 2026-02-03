import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { getCatalogProducts } from "../services/api"; // ✅ FIXED PATH

function ProductCards() {
  const [search, setSearch] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await getCatalogProducts();
        const mapped = Array.isArray(res)
          ? res
              .map((r) => ({
                id: r?.compoundCode ?? "",
                name: r?.compoundCode ?? "",
              }))
              .filter((p) => p.id)
          : [];

        if (isMounted) setProducts(mapped);
      } catch (e) {
        if (isMounted) {
          setError("Failed to load products");
          setProducts([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="py-8 px-6 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="relative mb-6 flex justify-end sticky top-20 z-50">
          <Search
            size={16}
            className="absolute right-3 z-10 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`
              w-full max-w-md px-2 py-2 backdrop-blur-md border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm shadow-sm
              ${scrolled ? "backdrop-blur-md bg-white/50 border-white/50" : "bg-white/90"}
            `}
          />
        </div>

        {loading && (
          <div className="text-sm text-gray-500 mb-4">Loading products...</div>
        )}
        {error && <div className="text-sm text-red-600 mb-4">{error}</div>}

        <div className="grid grid-cols-4 gap-4 justify-between">
          {filteredProducts.map((p, i) => (
            <div
              key={i}
              className="bg-white rounded-sm p-4 h-60 hover:shadow-xl transition flex items-center text-center justify-center"
              onClick={() => navigate(`/products/${p.id}`)}
            >
              <h2 className="font-semibold text-4xl break-words">{p.name}</h2>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ProductCards;
