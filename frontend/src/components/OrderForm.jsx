import React, { useState, useEffect, useRef } from "react";
import {
  X,
  ArrowRightLeft,
  Minus,
  Plus,
  Sparkles,
  PackagePlus,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import axios from "axios";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import emptyCartImage from "../assets/empty cart.png";

function CartPage() {
  const { cart, removeFromCart, updateQty, clearCart } = useCart();

  // ✅ store company/BP info
  const [company, setCompany] = useState({ cardCode: "", cardName: "" });

  // Addresses
  const [bpAddresses, setBpAddresses] = useState({
    shipTo: [],
    billTo: [],
    defaults: {},
  });
  const [shippingAddress, setShippingAddress] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [shipToFull, setShipToFull] = useState("");
  const [billToFull, setBillToFull] = useState("");
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [modalType, setModalType] = useState("ship");
  const [deliveryDate, setDeliveryDate] = useState("");

  const lastCardCodeRef = useRef("");

  const totalWeightAll = cart.reduce(
    (sum, i) => sum + Number(i.totalWeight || 0),
    0
  );
  const totalQtyAll = cart.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

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

  // ✅ If your app uses BP switching via localStorage
  const readSelectedBp = () => {
    try {
      const raw = localStorage.getItem("selected_bp");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const cardCode = String(parsed?.cardCode || "").trim();
      const cardName = String(parsed?.cardName || "").trim();
      if (!cardCode) return null;
      return { cardCode, cardName };
    } catch {
      return null;
    }
  };

  const resetAddressUI = () => {
    setBpAddresses({ shipTo: [], billTo: [], defaults: {} });
    setShippingAddress("");
    setBillingAddress("");
    setShipToFull("");
    setBillToFull("");
  };

  // =========================================================
  // 1) Always keep BP/company updated (POLL)
  //    This fixes: "company changed but cart page still old"
  // =========================================================
  useEffect(() => {
    let alive = true;

    const syncCompany = async () => {
      try {
        const token =
          localStorage.getItem("token") || sessionStorage.getItem("token");
        const apiUrl = process.env.REACT_APP_BACKEND_API_URL;

        if (!apiUrl || !token) return;

        // 1st priority: selected_bp (if exists)
        const selected = readSelectedBp();
        if (selected?.cardCode) {
          if (!alive) return;

          if (selected.cardCode !== lastCardCodeRef.current) {
            lastCardCodeRef.current = selected.cardCode;
            setCompany(selected);
            resetAddressUI();
          }
          return;
        }

        // fallback: backend user/company (poll this)
        const companyRes = await axios.get(`${apiUrl}/api/user/company?t=${Date.now()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });

        const cardCode = String(companyRes.data?.cardcode || "").trim();
        const cardName = String(companyRes.data?.cardname || "").trim();

        if (!alive) return;
        if (!cardCode) return;

        if (cardCode !== lastCardCodeRef.current) {
          lastCardCodeRef.current = cardCode;
          setCompany({ cardCode, cardName });
          resetAddressUI();
        }
      } catch (err) {
        // don't toast every second
        console.error("[BP sync] error:", err);
      }
    };

    // run once immediately
    syncCompany();

    // poll every 1 second
    const id = setInterval(syncCompany, 1000);

    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  // =========================================================
  // 2) Fetch addresses whenever company.cardCode changes
  // =========================================================
  useEffect(() => {
    let alive = true;

    const fetchAddresses = async () => {
      try {
        const token =
          localStorage.getItem("token") || sessionStorage.getItem("token");
        const apiUrl = process.env.REACT_APP_BACKEND_API_URL;

        if (!company.cardCode) return;
        if (!apiUrl || !token) return;

        resetAddressUI();

        const url = `${apiUrl}/api/sap/business-partners/${encodeURIComponent(
          company.cardCode
        )}/addresses?t=${Date.now()}`;

        const addrRes = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });

        if (!alive) return;

        const shipList = Array.isArray(addrRes.data.shipTo)
          ? addrRes.data.shipTo
          : [];
        const billList = Array.isArray(addrRes.data.billTo)
          ? addrRes.data.billTo
          : [];

        setBpAddresses({
          shipTo: shipList,
          billTo: billList,
          defaults: addrRes.data.defaults || {},
        });

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

    return () => {
      alive = false;
    };
  }, [company.cardCode]);

  const handleSubmit = async () => {
    if (!cart.length) {
      toast.error("Cart is empty!");
      return;
    }

    if (!company.cardCode) {
      toast.error("Customer CardCode missing. Please re-login.");
      return;
    }

    if (!deliveryDate) {
      toast.error("Please select Requested Delivery Date");
      return;
    }

    const badLine = cart.find((r) => {
      const item = String(r.itemCode || r.sku || "").trim();
      const qty = Number(r.quantity);
      return !item || !Number.isFinite(qty) || qty <= 0;
    });

    if (badLine) {
      toast.error("Some cart items missing ItemCode or Quantity. Please re-add.");
      return;
    }

    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_BACKEND_API_URL;

      if (!apiUrl) {
        toast.error("Backend API URL not set (REACT_APP_BACKEND_API_URL).");
        return;
      }
      if (!token) {
        toast.error("No auth token found. Please login again.");
        return;
      }

      const payload = {
        CardCode: company.cardCode,
        CardName: company.cardName,
        ShipToCode: shippingAddress,
        PayToCode: billingAddress,
        DocDueDate: deliveryDate,
        DocumentLines: cart.map((r) => ({
          ItemCode: r.itemCode || r.sku,
          Quantity: Number(r.quantity),
          WeightPerPcs: Number(r.weight || 0),
          TotalWeight: Number(r.totalWeight || 0),
          description: r.compound || "",
        })),
      };

      console.log("[ORDER] Submitting payload:", payload);

      await axios.post(`${apiUrl}/api/sap/sales-orders`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Order submitted!");
      clearCart();
    } catch (err) {
      console.error(err?.response?.data || err);

      toast.error(
        err?.response?.data?.details?.error?.message?.value ||
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
          <div className="flex justify-between items-center mb-4 px-2">
            <div className="flex flex-col">
              <h2 className="text-2xl font-semibold">Your Cart</h2>
              {/* ✅ Show current CardCode to confirm it updates */}
              <div className="text-[11px] text-gray-500">
                Current BP:{" "}
                <span className="font-semibold">{company.cardCode || "-"}</span>{" "}
                {company.cardName ? `(${company.cardName})` : ""}
              </div>
            </div>

            <div className="flex items-center gap-5 text-xs font-semibold">
              <div className="flex items-center gap-2 p-1 px-2 rounded-xl border border-gray-400">
                <span>Total Quantity</span>
                <span className="font-bold text-black">{totalQtyAll}</span>
              </div>
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
                    <th className="p-2 text-left">#</th>
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
                      <td className="p-2 text-center font-medium">
                        {index + 1}
                      </td>
                      <td className="p-2">
                        <div className="font-medium">{item.compound}</div>
                        <div className="text-gray-500 text-[11px]">
                          {(item.itemCode || item.sku) || "-"} | {item.width} ×{" "}
                          {item.length} × {item.thickness}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center rounded-2xl overflow-hidden w-full">
                          <button
                            type="button"
                            onClick={() =>
                              updateQty(
                                index,
                                Math.max(1, Number(item.quantity) - 1)
                              )
                            }
                            className="p-1"
                          >
                            <Minus size={14} />
                          </button>

                          <input
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateQty(index, Number(e.target.value) || 1)
                            }
                            className="w-full text-center outline-none px-2 py-1 bg-transparent"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              updateQty(index, Number(item.quantity) + 1)
                            }
                            className="p-1"
                          >
                            <Plus size={14} />
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

              <div className="text-xs font-semibold w-full">
                <button
                  onClick={handleSubmit}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-black text-white text-xs hover:bg-gray-200 hover:text-black transition font-semibold"
                >
                  <Sparkles size={16} />
                  Place Order
                </button>
              </div>

              <div
                className="mt-4 border rounded-lg p-4"
                style={{
                  background:
                    "radial-gradient(circle at 10% 60%, #ffeeee, #a8c5fe)",
                }}
              >
                <div className="flex flex-col justify-center items-center gap-4 mx-auto ">
                  <h2 className="text-xl font-semibold">
                    Add more items to your cart anytime.
                  </h2>
                  <Link
                    to="/products"
                    className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-black text-black text-xs hover:bg-black hover:text-white transition font-semibold"
                  >
                    <PackagePlus size={16} /> Add Order
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <div
              className="mt-4 border rounded-lg p-4"
              style={{
                background:
                  "radial-gradient(circle at 10% 60%, #ffeeee, #a8c5fe)",
              }}
            >
              <div className="flex flex-row gap-3">
                <div className="flex flex-col">
                  <img
                    src={emptyCartImage}
                    alt="Empty cart"
                    className="w-48 h-48 object-contain"
                  />
                </div>

                <div className="flex flex-col justify-center items-start flex-1">
                  <h2 className="text-xl font-semibold">Your cart is empty.</h2>
                  <p className="text-xs">Add more orders to get started.</p>
                </div>

                <div className="flex flex-col justify-end">
                  <Link
                    to="/products"
                    className="flex items-center mt-4 gap-2 px-4 py-2 rounded-2xl border border-black text-black text-xs hover:bg-black hover:text-white transition font-semibold"
                  >
                    <PackagePlus size={16} /> Add Order
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Shipping & Billing Preview */}
        <div className="md:w-1/3 space-y-5 rounded-lg">
          <div className="p-5 bg-white rounded-lg border border-gray-300">
            <h2 className="text-sm font-semibold mb-4">
              Requested Delivery Date <span className="text-red-500">*</span>
            </h2>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full border rounded-lg p-2 text-xs outline-none"
              min={new Date().toISOString().split("T")[0]}
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
                <span className="italic text-gray-400">
                  Your shipping address will appear here
                </span>
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
                <span className="italic text-gray-400">
                  Your billing address will appear here
                </span>
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
              {(modalType === "ship"
                ? bpAddresses.shipTo
                : bpAddresses.billTo
              ).map((addr) => (
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
              ))}
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
