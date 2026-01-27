import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

const products = [
  { id: "Cementing Solution", name: "Cementing Solution" },
  { id: "CMB O4", name: "CMB O4" },
  { id: "CMB OBT (AZ)", name: "CMB OBT (AZ)" },
  { id: "CP5", name: "CP5" },
  { id: "CTA", name: "CTA" },
  { id: "Cushion Gum", name: "Cushion Gum" },
  { id: "FND 1575", name: "FND 1575" },
  { id: "GW-616", name: "GW-616" },
  { id: "KMK NR10 PLUS", name: "KMK NR10 PLUS" },
  { id: "NZ39(B)", name: "NZ39(B)" },
  { id: "PFT 3662-T6", name: "PFT 3662-T6" },
  { id: "SCO 502MB", name: "SCO 502MB" },
  { id: "SCO 608MB", name: "SCO 608MB" },
  { id: "Side Wall 9911", name: "Side Wall 9911" },
  { id: "Supercool 5012", name: "Supercool 5012" },
  { id: "Supercool 5015 (Carters)", name: "Supercool 5015 (Carters)" },
  { id: "Toyopower 01MR", name: "Toyopower 01MR" },
  { id: "Toyopower 02MR", name: "Toyopower 02MR" },
  { id: "Toyopower 03MR", name: "Toyopower 03MR" },
  { id: "Vaculug Agriculture", name: "Vaculug Agriculture" },
  { id: "Vaculug Premium Super Single Trailer", name: "Vaculug Premium Super Single Trailer" },
  { id: "Vaculug Regional Drive/Urban", name: "Vaculug Regional Drive/Urban" },
];

function ProductCards() {
  const [search, setSearch] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  // Scroll listener
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10); // activate blur after scrolling 10px
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);


  return (
    <div className="py-8 px-6 min-h-screen">

      <div className="max-w-6xl mx-auto">
        {/* Search bar container */}
        <div className="relative mb-6 flex justify-end sticky top-20 z-50">
          {/* Search icon */}
          <Search size={16} className="absolute right-3 z-10 top-1/2 -translate-y-1/2 text-gray-500"/>
          {/* Search input */}
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            // className="w-full max-w-md px-2 py-2 backdrop-blur-md border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm shadow-sm"
            className={`
              w-full max-w-md px-2 py-2 backdrop-blur-md border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm shadow-sm
              ${scrolled ? "backdrop-blur-md bg-white/50 border-white/50" : "bg-white/90"}
            `}
          />
        </div>

        {/* Cards */}
        <div className="grid grid-cols-4 gap-4 justify-between">
          {filteredProducts.map((p, i) => (
            <div
              key={i}
              className="bg-white rounded-sm p-4 h-60 hover:shadow-xl transition flex items-center text-center justify-center"
              onClick={() => navigate(`/products/${p.id}`)} // navigate to product details
            >
              <h2 className="font-semibold text-4xl break-words">
                {p.name}
              </h2>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
}


export default ProductCards;
