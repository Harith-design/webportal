import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  ShoppingCart,
  ClockAlert,
  ClockFading,
  Flag,
  PackageOpen,
  Truck,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
// import { formatDate } from "../utils/formatDate";

function DashboardPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cards
  const [totalCount, setTotalCount] = useState(0);
  const [pastDueAmt, setPastDueAmt] = useState(0);          // from invoices
  const [dueSoonAmt, setDueSoonAmt] = useState(0);          // from orders
  const [totalOutstandingAmt, setTotalOutstandingAmt] = useState(0); // from OCRD.Balance

  // Tables & chart
  const [recentOrders, setRecentOrders] = useState([]);
  const [outstanding, setOutstanding] = useState([]);
  const [purchasesData, setPurchasesData] = useState([]);

  // CONFIG for "Due Soon" from orders
  const DUE_SOON_DAYS = 60;              // change to 30/90/etc.
  const USE_CALENDAR_MODE = false;       // set true to include until end of next month

  // Helpers
  const fmtMYR = (v, ccy = "MYR") =>
    new Intl.NumberFormat("en-MY", { style: "currency", currency: ccy }).format(
      Number(v || 0)
    );

  
    const shortMonth = (d) => d.toLocaleString("en-GB", { month: "short" });
  const ymKey = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const toNumber = (v) =>
    Number(String(v ?? 0).toString().replace(/[^0-9.-]/g, "")) || 0;

  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const endOfNextMonth = (fromDate) => {
    const y = fromDate.getFullYear();
    const m = fromDate.getMonth();
    const lastDay = new Date(y, m + 2, 0);
    return new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate(), 23, 59, 59, 999);
  };

  const buildMonthlySeries = (orderRows) => {
    const now = new Date();
    const months = [];
    const bucket = new Map();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ label: shortMonth(d), key: ymKey(d) });
      bucket.set(ymKey(d), 0);
    }
    for (const row of orderRows) {
      if (!row.orderDate) continue;
      const d = new Date(String(row.orderDate).replace(/-/g, "/"));
      if (isNaN(d)) continue;
      const key = ymKey(new Date(d.getFullYear(), d.getMonth(), 1));
      if (bucket.has(key)) bucket.set(key, bucket.get(key) + toNumber(row.total));
    }
    return months.map(({ label, key }) => ({ month: label, amount: bucket.get(key) || 0 }));
  };

  useEffect(() => {
      const fetchEverything = async () => {
        let user = localStorage.getItem("user") || sessionStorage.getItem("user");
        const userModel = JSON.parse(user || "{}");
        const cardcode = userModel.cardcode;
  
        try {
          // ---- fetch in parallel ----
          const [ordersRes, invoicesRes, bpRes] = await Promise.allSettled([
            axios.get("http://127.0.0.1:8000/api/sap/orders"),
            axios.get("http://127.0.0.1:8000/api/sap/invoices"),
            cardcode
              ? axios.get(`http://127.0.0.1:8000/api/sap/business-partners/${encodeURIComponent(cardcode)}`)
              : Promise.resolve({ status: "fulfilled", value: { data: null } }),
          ]);
  
          // -------- ORDERS → count, recent, chart, due soon --------
          if (ordersRes.status === "fulfilled" && ordersRes.value?.data?.data) {
            const filtered = ordersRes.value.data.data.filter(
              (o) => o.customerCode === cardcode
            );
  
            const formatted = filtered.map((o) => ({
              id: o.salesNo,
              poNo: o.poNo,
              customer: o.customer,
              orderDate: o.orderDate,
              dueDate: o.dueDate,
              total: o.total,
              currency: o.currency,
              status: o.status,
              download: o.download,
              docEntry: o.docEntry,
            }));
  
            setOrders(formatted);
            setTotalCount(formatted.length);
  
            const sorted = [...formatted].sort(
              (a, b) => new Date(b.orderDate) - new Date(a.orderDate)
            );
            setRecentOrders(sorted.slice(0, 4));
            setPurchasesData(buildMonthlySeries(formatted));
  
            // Due Soon (Open orders due within window)
            const today = startOfDay(new Date());
            const cutoff = USE_CALENDAR_MODE
              ? endOfNextMonth(today)
              : new Date(today.getTime() + DUE_SOON_DAYS * 24 * 60 * 60 * 1000);
  
            const dueSoonTotal = formatted
              .filter((o) => {
                const open = (o.status || "").toLowerCase().trim() === "open";
                if (!open || !o.dueDate) return false;
                const d = new Date(String(o.dueDate).replace(/-/g, "/"));
                if (isNaN(d)) return false;
                return d >= today && d <= cutoff;
              })
              .reduce((sum, o) => sum + toNumber(o.total), 0);
  
            setDueSoonAmt(dueSoonTotal);
          }
  
          // -------- INVOICES → past due + outstanding table --------
          let openInvoices = [];
          if (invoicesRes.status === "fulfilled" && invoicesRes.value?.data?.data) {
            openInvoices = invoicesRes.value.data.data
              .filter((v) => v.customerCode === cardcode)
              .map((v) => {
                const docTotal   = toNumber(v.total ?? v.DocTotal ?? 0);
                const paidToDate = toNumber(v.paidToDate ?? v.PaidToDate ?? 0);
                const remaining  = Math.max(0, docTotal - paidToDate);
                return {
                  id: v.invoiceNo,
                  docEntry: v.docEntry,
                  status: v.status,
                  dueDate: v.dueDate,
                  currency: v.currency || "MYR",
                  total: docTotal,
                  paidToDate,
                  remaining,
                };
              });
  
            // Past Due = sum remaining where Open and dueDate < today
            const today = startOfDay(new Date());
            const pastDue = openInvoices
              .filter((inv) => {
                if ((inv.status || "").toLowerCase().trim() !== "open") return false;
                if (!inv.dueDate) return false;
                const d = new Date(String(inv.dueDate).replace(/-/g, "/"));
                if (isNaN(d) || inv.remaining <= 0) return false;
                return d < today;
              })
              .reduce((sum, inv) => sum + inv.remaining, 0);
            setPastDueAmt(pastDue);
  
            // Outstanding table (top 4 by nearest due)
            const outstandingRows = openInvoices
              .filter((inv) => (inv.status || "").toLowerCase().trim() === "open" && inv.remaining > 0 && inv.dueDate)
              .sort(
                (a, b) =>
                  new Date(a.dueDate.replace(/-/g, "/")) -
                  new Date(b.dueDate.replace(/-/g, "/"))
              )
              .slice(0, 4)
              .map((inv) => ({
                id: inv.id,
                docEntry: inv.docEntry,
                dueDate: inv.dueDate,
                total: inv.remaining,
                currency: inv.currency,
              }));
            setOutstanding(outstandingRows);
          }
  
          // -------- TOTAL OUTSTANDING from OCRD.Balance --------
          if (bpRes.status === "fulfilled" && bpRes.value?.data?.data) {
            const bal = toNumber(bpRes.value.data.data.balance);
            setTotalOutstandingAmt(bal);
          } else {
            // Fallback: sum remaining of all open invoices
            const fallback = openInvoices
              .filter((inv) => (inv.status || "").toLowerCase().trim() === "open")
              .reduce((sum, inv) => sum + inv.remaining, 0);
            setTotalOutstandingAmt(fallback);
          }
        } catch (err) {
          console.error("Error fetching dashboard data:", err);
        } finally {
          setLoading(false);
        }
      };
  
      fetchEverything();
    }, []);

  

  return (
    <div className="space-y-6">
      {/* Row 1 - Cards + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-6 pt-6">
        {/* Left side - Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 h-full">
          {[
            {
              title: "Total Orders",
              value: totalCount,
              icon: <ShoppingCart size={30} color="black" />,
              bg: "radial-gradient(circle at 30% 70%, #b2faffff, #afc9ffff)",
            },
            {
              title: "Past Due",
              value: fmtMYR(pastDueAmt),
              icon: <ClockAlert size={30} color="black" />,
              bg: "radial-gradient(circle at 20% 80%, #ffbcbcff, #ff50a4ff)",
            },
            {
              title: "Due Soon",
              value: fmtMYR(dueSoonAmt),
              icon: <ClockFading size={30} color="black" />,
              bg: "radial-gradient(circle at 20% 80%, #c9ffa4ff, #89fdbdff)",
            },
            {
              title: "Total Outstanding",
              value: fmtMYR(totalOutstandingAmt),
              icon: <Flag size={30} color="black" />,
              bg: "radial-gradient(circle at 20% 80%, #f9b8ffff, #bc92ffff)",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="bg-white p-5 rounded-xl w-full h-32"
              style={{ background: card.bg }}
            >
              <div className="flex flex-col h-full justify-between">
                {/* Top: title + icon */}
                <div className="flex justify-between items-center">
                  <h3 className="text-lg">{card.title}</h3>
                  <div className="text-gray-600">{card.icon}</div>
                </div>

                {/* Bottom: value */}
                <p className="font-semibold text-3xl">{card.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Right side - Chart (from orders) */}
<div className="bg-white p-4 rounded-md border overflow-hidden h-full flex flex-col">
  <h3 className="text-sm mb-4">Your Purchases in the Last 12 Months</h3>
  <div className="flex-1 min-h-52">
  <ResponsiveContainer width="100%" height="100%">
    <LineChart
      data={purchasesData}
      margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
    >
      {/* <CartesianGrid strokeDasharray="3 3" /> */}
      <XAxis 
        dataKey="month" 
        tick={{ fontSize: 12 }}
        axisLine={false} 
        tickLine={false}/>
      <YAxis 
        tick={{ fontSize: 12 }} 
        axisLine={false} 
        tickLine={false}/>
      <Tooltip
        formatter={(value) =>
                    new Intl.NumberFormat("en-MY", {
                      style: "currency",
                      currency: "MYR",
                    }).format(Number(value))
                  }
                  contentStyle={{ fontSize: "14px" }}
      />
      <Line
        type="monotone"
        dataKey="amount"
        stroke="#ff2268"
        strokeWidth={2}
        dot={{ r: 4, fill: "#ffeff2" }}
        activeDot={{ r: 6 }}
      />
    </LineChart>
  </ResponsiveContainer>
</div>


</div>

      </div>

      {/* Row 2 - Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-6">
        {/* Recent Orders */}
        <div className="bg-white p-6 rounded-md overflow-x-auto border">
          <h3 className="text-lg mb-4">Recent Orders</h3>
          <div className="min-w-[400px]">
            <table className="table-auto w-full border-collapse">
              <thead>
                <tr className="text-left text-xs text-gray-500">
                  <th className="px-4 py-2 font-normal">Sales Number</th>
                  <th className="px-4 py-2 font-normal">Order Date</th>
                  <th className="px-4 py-2 font-normal">Status</th>
                </tr>
              </thead>
                <tbody className="text-xs">
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-4 py-2">
                      <Link
                        to={`/orders/${order.id}?de=${order.docEntry}`}
                        className="text-blue-600 hover:underline"
                      >
                        {order.id}
                      </Link>
                      </td>
                      <td className="px-4 py-2">{new Date(order.orderDate).toLocaleDateString("en-GB")}</td>
                      <td className="px-4 py-2 flex items-center gap-2">
                        {order.status.toLowerCase() === "delivered" ? (
                          <span className="text-green-600 flex items-center gap-1">
                            <Truck size={16} /> {order.status}
                          </span>
                        ) : (
                          <span className="text-blue-600 flex items-center gap-1">
                            <PackageOpen size={16} /> {order.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>

            </table>
          </div>
        </div>

        {/* Outstanding Payments *from invoices) */}
        <div className="bg-white p-6 rounded-md border overflow-x-auto">
          <h3 className="text-lg mb-4">Outstanding Payments</h3>
          <div className="min-w-[400px]">
            <table className="table-auto w-full border-collapse">
              <thead>
                <tr className="text-left text-xs text-gray-500">
                  <th className="px-4 py-2 font-normal">Invoice Number</th>
                  <th className="px-4 py-2 font-normal">Due Date</th>
                  <th className="px-4 py-2 font-normal">Amount</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {outstanding.length ? (
                outstanding.map((inv) => (
                  <tr key={inv.id}>
                    <td className="px-4 py-2">
                      <Link
                        to={`/invoices/${inv.id}?de=${inv.docEntry}`}
                        className="text-blue-600 hover:underline"
                      >
                        {inv.id}
                      </Link>
                    </td>
                    <td className="px-4 py-2">
                      {inv.dueDate
                        ? new Date(
                            inv.dueDate.replace(/-/g, "/")
                          ).toLocaleDateString("en-GB")
                        : "-"}
                    </td>
                    <td className="px-4 py-2">
                      {fmtMYR(inv.total, inv.currency)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 py-2 text-gray-500">
                    {loading ? "Loading…" : "No outstanding invoices"}
                  </td>
                </tr>
              )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
