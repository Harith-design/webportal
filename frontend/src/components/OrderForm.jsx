import React, { useState, useEffect } from "react";
import { X, ArrowRightLeft, Minus, Plus, Sparkles, PackagePlus } from "lucide-react";
import { useCart } from "../context/CartContext";
import axios from "axios";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import emptyCartImage from "../assets/empty cart.png";

function CartPage() {
  const { cart, removeFromCart, updateQty, clearCart } = useCart();

  // ✅ NEW: store company info (CardCode is required by backend)
  const [company, setCompany] = useState({ cardCode: "", cardName: "" });

  // Addresses
  const [bpAddresses, setBpAddresses] = useState({ shipTo: [], billTo: [], defaults: {} });
  const [shippingAddress, setShippingAddress] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [shipToFull, setShipToFull] = useState("");
  const [billToFull, setBillToFull] = useState("");
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [modalType, setModalType] = useState("ship"); // 'ship' or 'bill'
  const [deliveryDate, setDeliveryDate] = useState("");

  const totalWeightAll = cart.reduce((sum, i) => sum + Number(i.totalWeight || 0), 0);
  const totalQtyAll = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  // Format multi-line address
  const formatAddressForDisplay = (a, kind) => {
    if (!a) return "";
    const firstLine = kind === "ship" ? "Ship To" : "Bill To";
    const lines = [
      firstLine,
      [a.Building, a.Street].filter(Boolean).join(", "),
      [a.ZipCode, a.City].filter(Boolean).join(" "),
      [a.County, a.Country].filter(Boolean).join(", "),
    ].filter(Boolean);
    return lines.join("\n");
  };

  // Fetch default addresses
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const apiUrl = process.env.REACT_APP_BACKEND_API_URL;

        // Fetch user company first
        const companyRes = await axios.get(`${apiUrl}/api/user/company`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // ✅ NEW: store company info
        setCompany({
          cardCode: companyRes.data?.cardcode || "",
          cardName: companyRes.data?.cardname || "",
        });

        const cardCode = companyRes.data?.cardcode;
        if (!cardCode) return;

        // Fetch BP addresses
        const addrRes = await axios.get(
          `${apiUrl}/api/sap/business-partners/${encodeURIComponent(cardCode)}/addresses`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const shipList = Array.isArray(addrRes.data.shipTo) ? addrRes.data.shipTo : [];
        const billList = Array.isArray(addrRes.data.billTo) ? addrRes.data.billTo : [];

        setBpAddresses({ shipTo: shipList, billTo: billList, defaults: addrRes.data.defaults || {} });

        const defShip = shipList.find((x) => x.IsDefault) || shipList[0] || {};
        const defBill = billList.find((x) => x.IsDefault) || billList[0] || {};

        setShippingAddress(defShip.AddressName || "");
        setBillingAddress(defBill.AddressName || "");
        setShipToFull(formatAddressForDisplay(defShip, "ship"));
        setBillToFull(formatAddressForDisplay(defBill, "bill"));
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch addresses");
      }
    };

    fetchAddresses();
  }, []);

  const handleSubmit = async () => {
    if (!cart.length) {
      toast.error("Cart is empty!");
      return;
    }

    // ✅ NEW guard: CardCode required by backend
    if (!company.cardCode) {
      toast.error("Customer CardCode missing. Please re-login.");
      return;
    }

    if (!deliveryDate) {
      toast.error("Please select Requested Delivery Date");
      return;
    }

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_BACKEND_API_URL;

      // ✅ UPDATED: include CardCode + CardName (optional)
      const payload = {
        CardCode: company.cardCode,
        CardName: company.cardName,
        ShipToCode: shippingAddress,
        PayToCode: billingAddress,
        DocDueDate: deliveryDate, // ✅ SAP requested delivery date
        DocumentLines: cart.map((r) => ({
          ItemCode: r.sku,
          Quantity: Number(r.quantity),
          description: r.compound || "",
        })),
      };

      await axios.post(`${apiUrl}/api/sap/sales-orders`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Order submitted!");
      clearCart();
    } catch (err) {
      console.error(err?.response?.data || err);

      toast.error(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Submit failed"
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 mt-4">
      <div className="flex flex-col md:flex-row gap-10">
        
        {/* LEFT: Cart Table */}
        <div className="flex-2 flex-1">
          {/* Heading + totals container */}
          <div className="flex justify-between items-center mb-4 px-2">
            {/* Left side */}
            <h2 className="text-2xl font-semibold">Your Cart</h2>

            {/* Right side */}
            <div className="flex items-center gap-5 text-xs font-semibold">
                {/* Quantity group */}
                <div className="flex items-center gap-2 p-1 px-2 rounded-xl border border-gray-400">
                  <span>Total Quantity</span>
                  <span className="font-bold text-black">{totalQtyAll}</span>
                </div>
                {/* Weight group */}
                <div className="flex items-center gap-2 p-1 px-2 rounded-xl border border-gray-400">
                  <span>Total Weight</span>
                  <span className="font-bold text-black">{totalWeightAll}</span>
                </div>
            </div>
          </div>

          {cart.length > 0 ? (
          <>
          <table className="w-full text-xs overflow-x-auto mb-2">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">#</th>  {/* Row number */}
                <th className="p-2 text-left">Item</th>
                <th className="p-2 text-center w-28">Quantity</th>
                <th className="p-2 text-center w-28">Weight</th>
                <th className="p-2 text-center w-32">Total Weight</th>
                <th className="p-2 text-left w-16"></th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item, index) => (
                <tr key={index} className="border-t border-gray-300">
                  <td className="p-2 text-center font-medium">{index + 1}</td> {/* Row number */}
                  <td className="p-2">
                    <div className="font-medium">{item.compound}</div>
                    <div className="text-gray-500 text-[11px]">
                      {item.sku} | {item.width} × {item.length} × {item.thickness}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center rounded-2xl overflow-hidden w-full">
                      {/* Minus button */}
                      <button
                        type="button"
                        onClick={() =>
                          updateQty(index, Math.max(1, Number(item.quantity) - 1))
                        }
                        className="p-1"
                      >
                        <Minus size={14} />
                      </button>

                      {/* Number input */}
                      <input
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateQty(index, Number(e.target.value) || 1)
                        }
                        className="w-full text-center outline-none px-2 py-1 bg-transparent"
                      />

                      {/* Plus button */}
                      <button
                        type="button"
                        onClick={() =>
                          updateQty(index, Number(item.quantity) + 1)
                        }
                        className="p-1"
                      >
                        <Plus size={14}/>
                      </button>
                    </div>
                  </td>
                  <td className="p-2 text-center">{item.weight}</td>
                  <td className="p-2 text-center">{item.totalWeight}</td>
                  <td className="p-2 text-center">
                    <button onClick={() => removeFromCart(index)}>
                      <X size={14} className="text-gray-500" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Top row */}
          <div className="text-xs font-semibold w-full">
            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-black text-white text-xs hover:bg-blue-700 transition font-semibold"
            >
              <Sparkles size={16} />
              Submit Order
            </button>
          </div>

          {/* Bottom Action Row (Pseudo Table Row) */}
          <div className="mt-4 border rounded-lg p-4" style={{background: "radial-gradient(circle at 10% 60%, #ffeeee, #a8c5fe)"}}>
            {/* BOTTOM ROW — New Order */}
            <div className="flex flex-col justify-center items-center gap-4 mx-auto ">
              <h2 className="text-xl font-semibold">Add more items to your cart anytime.</h2>
              <Link
                to="/products"
                className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-black text-black text-xs hover:bg-black hover:text-white transition font-semibold"
              >
                <PackagePlus size={16}/> Add Order
              </Link>
            </div>
          </div>
          </>
          ) : (
            <>
              {/* Bottom Action Row (Pseudo Table Row) */}
              <div className="mt-4 border rounded-lg p-4" style={{background: "radial-gradient(circle at 10% 60%, #ffeeee, #a8c5fe)"}}>
                {/* BOTTOM ROW — New Order */}
                <div className="flex flex-row gap-3">
                  <div className="flex flex-col">
                    <img src={emptyCartImage} className="w-48 h-48 object-contain"/>
                  </div>

                  {/* LEFT: Empty Cart Message */}
                  <div className="flex flex-col justify-center items-start flex-1">
                    <h2 className="text-xl font-semibold">Your cart is empty.</h2>
                    <p className="text-xs">Add more orders to get started.</p>
                  </div>

                  <div className="flex flex-col justify-end">
                    <Link
                      to="/products"
                      className="flex items-center  mt-4 gap-2 px-4 py-2 rounded-2xl border border-black text-black text-xs hover:bg-black hover:text-white transition font-semibold"
                    >
                      <PackagePlus size={16}/> Add Order
                    </Link>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* RIGHT: Shipping & Billing Preview */}
        <div className="md:w-1/3 space-y-5 rounded-lg">
          {/* Requested Delivery Date */}
          <div className="p-5 bg-white rounded-lg border border-gray-300">
            <h2 className="text-sm font-semibold mb-4">
              Requested Delivery Date <span className="text-red-500">*</span>
            </h2>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full border rounded-lg p-2 text-xs outline-none"
              min={new Date().toISOString().split("T")[0]} // prevent past date
              required
            />
          </div>

          <div className="bg-white p-5 rounded-lg border border-gray-300">
            <p className="text-sm font-semibold mb-1 flex items-center justify-between">
              Shipping Address
              <button
                type="button"
                onClick={() => {
                  setModalType("ship");
                  setShowAddressModal(true);
                }}
                className="ml-2 p-1 rounded hover:bg-gray-200"
              >
                <ArrowRightLeft size={16} />
              </button>
            </p>
            <p className="text-xs leading-5 whitespace-pre-wrap mt-2 min-h-[80px]">
              {shipToFull ? (
                shipToFull
              ) : (
                <span className="italic text-gray-400">Your shipping address will appear here</span>
              )}
            </p>
          </div>

          <div className="bg-white p-5 rounded-lg border border-gray-300">
            <p className="text-sm font-semibold mb-1 flex items-center justify-between">
              Billing Address
              <button
                type="button"
                onClick={() => {
                  setModalType("bill");
                  setShowAddressModal(true);
                }}
                className="ml-2 p-1 rounded hover:bg-gray-200"
              >
                <ArrowRightLeft size={16} />
              </button>
            </p>
            <p className="text-xs leading-5 whitespace-pre-wrap mt-2 min-h-[80px]">
              {billToFull ? (
                billToFull
              ) : (
                <span className="italic text-gray-400">Your billing address will appear here</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Address Modal */}
      {showAddressModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
          onClick={() => setShowAddressModal(false)}
        >
          <div
            className="bg-white rounded-lg p-4 w-80 max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold mb-2">
              Change {modalType === "ship" ? "Shipping" : "Billing"} Address
            </h3>
            <ul>
              {(modalType === "ship" ? bpAddresses.shipTo : bpAddresses.billTo).map(
                (addr) => (
                  <li
                    key={addr.AddressName}
                    onClick={() => {
                      if (modalType === "ship") {
                        setShippingAddress(addr.AddressName);
                        setShipToFull(formatAddressForDisplay(addr, "ship"));
                      } else {
                        setBillingAddress(addr.AddressName);
                        setBillToFull(formatAddressForDisplay(addr, "bill"));
                      }
                      setShowAddressModal(false);
                    }}
                    className="px-2 py-1 mb-1 cursor-pointer hover:bg-gray-100 rounded"
                  >
                    {formatAddressForDisplay(addr, modalType)}
                  </li>
                )
              )}
            </ul>
            <button
              className="mt-2 w-full py-1 text-xs text-white bg-gray-500 rounded hover:bg-gray-600"
              onClick={() => setShowAddressModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CartPage;
