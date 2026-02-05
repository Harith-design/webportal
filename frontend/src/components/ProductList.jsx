import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { getCatalogProducts } from "../services/api"; // ✅ FIXED PATH
import { Link } from "react-router-dom";
import { ShoppingCartIcon } from "lucide-react";

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
                image: `http://localhost:8000/uploads/products/${r?.compoundCode}.jpg`, // or .png if your images are PNG
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
        <div className={`
    sticky top-20 z-50 mb-6 flex justify-end
    ${scrolled ? "bg-white/20 backdrop-blur-2xl shadow-lg" : "bg-transparent"}
  `}>
          <Search
            size={16}
            className="absolute right-3 z-10 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className= "w-full max-w-md px-2 py-2 border bg-white/70 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm shadow-sm"
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
              className="p-5 font-semibold text-lg rounded-sm h-60 shadow-md transition flex items-center text-center justify-center cursor-pointer hover:shadow-xl transform transition-all duration-300 ease-out hover:-translate-y-1"
              onClick={() => navigate(`/products/${p.id}`)}
              style={{background: "radial-gradient(circle at 20% 20%, #f2baba 0%, #edf1f3 50%, #eaf4ff 40%)",
        }}
            >
              {p.name}
                {/* Add to cart */}
                <div className="absolute bottom-0 left-0 w-full flex p-2">
                  <div className="flex w-full justify-center items-center gap-2 px-4 py-2 text-black border rounded-lg border-black  text-xs hover:bg-black hover:text-white transition font-semibold">
                    <ShoppingCartIcon size={16}/> Add to Cart
                  </div>
                </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ProductCards;
