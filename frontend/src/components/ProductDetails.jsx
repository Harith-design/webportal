import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Plus, Minus } from "lucide-react";
import { useCart } from "../context/CartContext";
import {
  getCatalogOptions,
  resolveCatalogItem,
  getSapItemByCode, // ✅ W2: fetch weight from SAP by itemCode
} from "../services/api"; // ✅ MSSQL-only (CatalogController) + SAP single item

function ProductDetails() {
  const { id } = useParams();
  const { addToCart } = useCart();

  const product = useMemo(() => {
    return {
      name: id,
      image: "https://via.placeholder.com/500x500?text=Product+Image",
    };
  }, [id]);

  const [options, setOptions] = useState({
    widths: [],
    topWidths: [],
    baseWidths: [],
    thicknesses: [],
    lengths: [],
  });

  // selected specs
  const [sku, setSKU] = useState(""); // will display selected variant sku/itemcode
  const [width, setWidth] = useState(""); // ✅ Step 6: start empty
  const [length, setLength] = useState(""); // ✅ Step 6: start empty
  const [thickness, setThickness] = useState(""); // ✅ Step 6: start empty

  // resolved
  const [itemCode, setItemCode] = useState("");

  // quantity + weight
  const [qty, setQty] = useState(1);
  const numericQty = Number(qty) || 0;

  // ✅ Step 2: weight is required (manual only)
  // ✅ W2: now we auto-fill this from SAP once itemCode is known (still editable, no UI change)
  const [weight, setWeight] = useState("");
  const numericWeight = Number(weight) || 0;
  const totalWeight = numericQty * numericWeight;

  // status
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loadingResolve, setLoadingResolve] = useState(false);
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");

  // ✅ Step 5: 409 matches will be shown inside SKU dropdown
  const [variantMatches, setVariantMatches] = useState([]);

  // guards
  const optionsLoadedRef = useRef(false);

  // after user picks a variant, skip one auto-resolve
  const skipResolveOnceRef = useRef(false);

  // debounce to avoid API spam
  const resolveTimerRef = useRef(null);

  // ✅ W2: prevent spamming SAP weight fetch if itemCode changes fast
  const lastWeightItemCodeRef = useRef("");

  // ✅ Step 6: format numeric display nicely (prevents 10.1999999999)
  const formatNum = (v) => {
    if (v === null || v === undefined || v === "") return "";
    const n = Number(v);
    if (!Number.isFinite(n)) return String(v);

    // Remove floating noise: round to max 2 decimals, then trim zeros
    const fixed = n.toFixed(2); // "10.20"
    return fixed.replace(/\.?0+$/, ""); // -> "10.2" or "10"
  };

  // ✅ Step 2: validation helper
  const validateBeforeAdd = () => {
    if (!itemCode || String(itemCode).trim() === "") {
      return "Item code not resolved yet. Please select valid specs.";
    }
    if (!Number.isFinite(numericQty) || numericQty < 1) {
      return "Quantity must be at least 1.";
    }
    if (
      weight === null ||
      weight === undefined ||
      String(weight).trim() === "" ||
      !Number.isFinite(numericWeight) ||
      numericWeight <= 0
    ) {
      return "Weight is required and must be greater than 0.";
    }
    return "";
  };

  const isAddDisabled = Boolean(validateBeforeAdd()) || loadingResolve;

  // ---------------------------------------------------------
  // STEP A: Load options for selected compoundCode (id) from MSSQL
  // ---------------------------------------------------------
  useEffect(() => {
    let alive = true;

    const fetchOptions = async () => {
      try {
        optionsLoadedRef.current = false;

        setLoadingOptions(true);
        setError("");
        setValidationError("");

        // reset resolve + matches when compound changes
        setItemCode("");
        setSKU("");
        setWeight(""); // ✅ keep as is (weight resets when compound changes)
        setVariantMatches([]);

        // ✅ Step 6: do NOT preset defaults; reset selects to empty
        setWidth("");
        setLength("");
        setThickness("");

        // ✅ W2: reset weight fetch guard
        lastWeightItemCodeRef.current = "";

        const res = await getCatalogOptions(id);
        const opt = res?.options || {};

        const next = {
          widths: Array.isArray(opt.widths) ? opt.widths : [],
          topWidths: Array.isArray(opt.topWidths) ? opt.topWidths : [],
          baseWidths: Array.isArray(opt.baseWidths) ? opt.baseWidths : [],
          thicknesses: Array.isArray(opt.thicknesses) ? opt.thicknesses : [],
          lengths: Array.isArray(opt.lengths) ? opt.lengths : [],
        };

        if (!alive) return;

        setOptions(next);

        optionsLoadedRef.current = true;

        console.log("[Catalog/MSSQL] Options loaded:", {
          compoundCode: id,
          options: next,
        });
      } catch (e) {
        if (!alive) return;

        optionsLoadedRef.current = true;
        setError("Failed to load product options");
        setOptions({
          widths: [],
          topWidths: [],
          baseWidths: [],
          thicknesses: [],
          lengths: [],
        });

        console.log("[Catalog/MSSQL] Options load failed:", {
          compoundCode: id,
          status: e?.response?.status,
          data: e?.response?.data,
          message: e?.message,
        });
      } finally {
        if (alive) setLoadingOptions(false);
      }
    };

    fetchOptions();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ✅ Clear matches when user changes specs (prevents stale 409 list)
  useEffect(() => {
    if (variantMatches.length > 0) {
      setVariantMatches([]);
      setItemCode("");
      setSKU("");
      // NOTE: do not touch weight here (let user keep if they typed)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, length, thickness]);

  // ---------------------------------------------------------
  // STEP B: Resolve specs -> exact ItemCode from MSSQL
  // ---------------------------------------------------------
  useEffect(() => {
    let alive = true;

    const runResolve = async () => {
      try {
        if (!id) return;

        // ✅ if multiple matches are waiting (409), STOP auto resolve
        if (variantMatches.length > 0) return;

        // ✅ skip once after SKU pick
        if (skipResolveOnceRef.current) {
          skipResolveOnceRef.current = false;
          return;
        }

        if (!optionsLoadedRef.current) return;

        // ✅ Step 6: require selection before resolving
        if (options.widths.length > 0 && (!width || String(width).trim() === ""))
          return;
        if (options.lengths.length > 0 && (!length || String(length).trim() === ""))
          return;

        setLoadingResolve(true);
        setError("");
        setValidationError("");

        const params = {
          compoundCode: id,
          width: width ? Number(width) : undefined,
          thickness: thickness ? Number(thickness) : undefined,
          length: length ? Number(length) : undefined,
        };

        Object.keys(params).forEach((k) => {
          if (params[k] === undefined || params[k] === null || params[k] === "") {
            delete params[k];
          }
        });

        console.log("[Catalog/MSSQL] Resolving item with params:", params);

        const resolved = await resolveCatalogItem(params);

        if (!alive) return;

        const resolvedItemCode = resolved?.itemCode || "";
        const resolvedSku = resolved?.compoundSku || "";

        setItemCode(resolvedItemCode);
        setSKU(resolvedSku || resolvedItemCode); // show something in SKU No
        setError("");

        console.log("[Catalog/MSSQL] Resolve success:", {
          compoundCode: id,
          itemCode: resolvedItemCode,
          compoundSku: resolvedSku,
          spec: resolved?.spec,
        });
      } catch (e) {
        if (!alive) return;

        const status = e?.response?.status;

        if (status === 409) {
          const matches = e?.response?.data?.matches;

          // ✅ store matches so SKU dropdown becomes picker
          setVariantMatches(Array.isArray(matches) ? matches : []);

          setError(
            "Multiple items matched. Please choose SKU No to confirm the exact variant."
          );

          // keep unresolved until user picks
          setItemCode("");
          setSKU("");
        } else if (status === 404) {
          setError("No matching item found for selected specs.");
          setItemCode("");
          setSKU("");
          setVariantMatches([]);
        } else if (status === 429) {
          setError("Too many requests. Please wait a moment and try again.");
          setItemCode("");
          setSKU("");
        } else {
          setError("Failed to resolve item code from MSSQL.");
          setItemCode("");
          setSKU("");
          setVariantMatches([]);
        }

        console.log("[Catalog/MSSQL] Resolve failed:", {
          compoundCode: id,
          status,
          data: e?.response?.data,
          message: e?.message,
        });
      } finally {
        if (alive) setLoadingResolve(false);
      }
    };

    // debounce
    if (resolveTimerRef.current) clearTimeout(resolveTimerRef.current);
    resolveTimerRef.current = setTimeout(() => {
      runResolve();
    }, 300);

    return () => {
      alive = false;
      if (resolveTimerRef.current) clearTimeout(resolveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    id,
    width,
    thickness,
    length,
    options.widths.length,
    options.lengths.length,
  ]);

  // ---------------------------------------------------------
  // ✅ W2 + A3: When itemCode is resolved, fetch weight from SAP and auto-fill Weight (kg)
  // A3 rule: ONLY auto-fill if user hasn't typed weight (weight is empty)
  // Uses your SapController getItemByCode() which returns: data.Weight (kg)
  // ---------------------------------------------------------
  useEffect(() => {
    let alive = true;

    const fetchWeightFromSap = async () => {
      try {
        const code = String(itemCode || "").trim();
        if (!code) return;

        // Avoid re-fetching for the same itemCode
        if (lastWeightItemCodeRef.current === code) return;

        lastWeightItemCodeRef.current = code;

        console.log("[SAP] Fetching weight for itemCode:", code);

        const res = await getSapItemByCode(code);

        if (!alive) return;

        const sapWeight = res?.data?.Weight;

        // Only set if we got a valid positive number
        const n = Number(sapWeight);
        if (Number.isFinite(n) && n > 0) {
          const next = String(formatNum(n));

          // ✅ A3: do NOT overwrite manual input
          setWeight((prev) => (String(prev).trim() ? prev : next));
          setValidationError("");

          console.log("[SAP] Weight resolved:", {
            itemCode: code,
            weightKg: n,
          });
        } else {
          console.log("[SAP] Weight missing/invalid from SAP:", {
            itemCode: code,
            sapWeight,
            res,
          });
          // Do not block user; they can still manually enter weight if needed
        }
      } catch (e) {
        if (!alive) return;

        console.log("[SAP] Weight fetch failed:", {
          itemCode,
          status: e?.response?.status,
          data: e?.response?.data,
          message: e?.message,
        });
        // no UI change: we do NOT show extra UI error; user can still type weight manually
      }
    };

    fetchWeightFromSap();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemCode]);

  // ✅ SKU dropdown handler: if variantMatches exist, SKU selection picks exact variant
  const handleSkuChange = (value) => {
    setValidationError("");

    // If no variant matches, SKU acts as display only
    if (!variantMatches || variantMatches.length === 0) {
      setSKU(value);
      return;
    }

    // value is the selected itemCode
    const row = variantMatches.find((m) => String(m?.U_ItemCode) === String(value));

    if (!row) {
      setSKU(value);
      return;
    }

    skipResolveOnceRef.current = true;

    const chosenItemCode = String(row.U_ItemCode || "");
    const chosenSku = String(row.U_CompoundSKU || chosenItemCode);

    setItemCode(chosenItemCode);
    setSKU(chosenSku);

    if (row.U_Width !== null && row.U_Width !== undefined) setWidth(String(row.U_Width));
    if (row.U_Length !== null && row.U_Length !== undefined) setLength(String(row.U_Length));
    if (row.U_Thickness !== null && row.U_Thickness !== undefined)
      setThickness(String(row.U_Thickness));

    // clear matches after selection
    setVariantMatches([]);
    setError("");

    console.log("[Catalog/MSSQL] SKU picked variant:", {
      itemCode: chosenItemCode,
      compoundSku: chosenSku,
      width: row.U_Width,
      thickness: row.U_Thickness,
      length: row.U_Length,
    });
  };

  const handleSubmit = () => {
    const msg = validateBeforeAdd();
    if (msg) {
      setValidationError(msg);
      return;
    }

    const item = {
      compound: product.name,
      itemCode,
      sku: sku || itemCode || "",
      width,
      length,
      thickness,
      quantity: Number(qty),
      weight: Number(weight) || 0,
      totalWeight: totalWeight,
    };

    addToCart(item);
    console.log("Added to cart:", item);
    setValidationError("");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="flex items-center justify-center">
            <img
              src={product.image}
              alt={product.name}
              className="rounded-xl shadow-md object-contain max-h-[500px]"
            />
          </div>

          <div className="space-y-6">
            <h1 className="text-3xl font-bold">{product.name}</h1>

            <div className="space-y-4 text-xs">
              {/* SKU No (acts as variant picker if multiple matches) */}
              <div>
                <label className="block text-gray-500 mb-1">SKU No</label>
                <select
                  value={variantMatches.length > 0 ? itemCode || "" : sku || ""}
                  onChange={(e) => handleSkuChange(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2"
                >
                  {variantMatches.length > 0 ? (
                    <>
                      <option value="">-- Select SKU --</option>
                      {variantMatches.map((m, i) => {
                        const code = String(m?.U_ItemCode || "");
                        const compoundSku = String(m?.U_CompoundSKU || "");
                        const w = m?.U_Width;
                        const t = m?.U_Thickness;
                        const l = m?.U_Length;

                        const labelParts = [];
                        if (w !== null && w !== undefined) labelParts.push(`W ${formatNum(w)}`);
                        if (t !== null && t !== undefined) labelParts.push(`T ${formatNum(t)}`);
                        if (l !== null && l !== undefined) labelParts.push(`L ${formatNum(l)}`);

                        const label = `${compoundSku ? compoundSku : code}${
                          labelParts.length ? " — " + labelParts.join(", ") : ""
                        }`;

                        return (
                          <option key={i} value={code}>
                            {label}
                          </option>
                        );
                      })}
                    </>
                  ) : (
                    <>
                      <option value="">{sku || itemCode || ""}</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-gray-500 mb-1">Width</label>
                <select
                  value={width}
                  onChange={(e) => {
                    setWidth(e.target.value);
                    setValidationError("");
                  }}
                  className="w-full border rounded-xl px-3 py-2"
                >
                  <option value="">{loadingOptions ? "Loading..." : "-- Select Width --"}</option>

                  {options.widths.map((w, i) => (
                    <option key={i} value={String(w)}>
                      {formatNum(w)} mm
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-500 mb-1">Length</label>
                <select
                  value={length}
                  onChange={(e) => {
                    setLength(e.target.value);
                    setValidationError("");
                  }}
                  className="w-full border rounded-xl px-3 py-2"
                >
                  <option value="">{loadingOptions ? "Loading..." : "-- Select Length --"}</option>

                  {options.lengths.map((l, i) => (
                    <option key={i} value={String(l)}>
                      {formatNum(l)} mm
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-500 mb-1">Thickness</label>
                <select
                  value={thickness}
                  onChange={(e) => {
                    setThickness(e.target.value);
                    setValidationError("");
                  }}
                  className="w-full border rounded-xl px-3 py-2"
                >
                  <option value="">
                    {loadingOptions
                      ? "Loading..."
                      : options.thicknesses.length
                      ? "-- Select Thickness --"
                      : "No options"}
                  </option>

                  {options.thicknesses.map((t, i) => (
                    <option key={i} value={String(t)}>
                      {formatNum(t)} mm
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-500 mb-1">Quantity</label>
                  <div className="flex items-center border rounded-xl overflow-hidden shadow-sm w-full bg-white">
                    <button
                      type="button"
                      onClick={() => {
                        setQty((q) => Math.max(1, q - 1));
                        setValidationError("");
                      }}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-400 transition"
                    >
                      <Minus size={16} className="text-white" />
                    </button>

                    <input
                      type="number"
                      min="1"
                      value={qty}
                      onChange={(e) => {
                        setQty(e.target.value);
                        setValidationError("");
                      }}
                      className="w-full text-center outline-none"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        setQty((q) => q + 1);
                        setValidationError("");
                      }}
                      className="px-3 py-2 bg-blue-600 hover:bg-gray-200 transition"
                    >
                      <Plus size={16} className="text-white" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-500 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => {
                      setWeight(e.target.value);
                      setValidationError("");
                    }}
                    className="w-full border rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-500 mb-1">Total Weight (kg)</label>
                <input
                  type="number"
                  value={totalWeight}
                  readOnly
                  className="w-full border rounded-xl px-3 py-2 bg-gray-100 font-semibold cursor-not-allowed"
                />
              </div>

              {error && <div className="text-red-600 text-xs">{error}</div>}
              {validationError && <div className="text-red-600 text-xs">{validationError}</div>}
              {loadingResolve && <div className="text-gray-500 text-xs">Resolving item...</div>}

              <button
                onClick={handleSubmit}
                className="w-full bg-blue-600 text-white text-sm rounded-xl py-3 font-semibold hover:bg-blue-700 transition"
                disabled={isAddDisabled}
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
