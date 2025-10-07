import React from "react";
import {
  ShoppingCart,
  ClockAlert,
  ClockFading,
  Flag,
  CircleEllipsis,
  Truck,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const purchasesData = [
  { month: "Oct", amount: 1200 },
  { month: "Nov", amount: 1500 },
  { month: "Dec", amount: 1800 },
  { month: "Jan", amount: 2000 },
  { month: "Feb", amount: 1750 },
  { month: "Mar", amount: 2200 },
  { month: "Apr", amount: 1900 },
  { month: "May", amount: 2500 },
  { month: "Jun", amount: 2300 },
  { month: "Jul", amount: 2100 },
  { month: "Aug", amount: 2600 },
  { month: "Sep", amount: 2400 },
];

function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Row 1 - Cards + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left side - Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            {
              title: "Total Orders",
              value: "201",
              icon: <ShoppingCart size={30} color="black" />,
              bg: "radial-gradient(circle at 30% 70%, #b2faffff, #afc9ffff)",
            },
            {
              title: "Past Due",
              value: "RM 2,100.50",
              icon: <ClockAlert size={30} color="black" />,
              bg: "radial-gradient(circle at 20% 80%, #ffbcbcff, #ff50a4ff)",
            },
            {
              title: "Due Soon",
              value: "RM 369.22",
              icon: <ClockFading size={30} color="black" />,
              bg: "radial-gradient(circle at 20% 80%, #c9ffa4ff, #89fdbdff)",
            },
            {
              title: "Total Outstanding",
              value: "RM 1,568.50",
              icon: <Flag size={30} color="black" />,
              bg: "radial-gradient(circle at 20% 80%, #f9b8ffff, #bc92ffff)",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="bg-white p-5 rounded-xl shadow-md w-full h-32"
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

        {/* Right side - Chart */}
<div className="bg-white p-4 rounded-xl shadow-md overflow-hidden">
  <h3 className="text-sm mb-4">Your Purchases in the Last 12 Months</h3>
  <div style={{ width: "100%", height: 200 }}>
  <ResponsiveContainer width="100%" height="100%">
    <LineChart
      data={purchasesData}
      margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
    >
      {/* <CartesianGrid strokeDasharray="3 3" /> */}
      <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false}/>
      <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false}/>
      <Tooltip
        formatter={(value) => `RM ${value}`}
        contentStyle={{ fontSize: "14px" }} // prevents layout shift
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white p-6 rounded-xl shadow-md overflow-x-auto">
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
                <tr>
                  <td className="px-4 py-2">1001</td>
                  <td className="px-4 py-2">25-08-2025</td>
                  <td className="px-4 py-2 text-blue-600 flex items-center gap-2">
                    <CircleEllipsis size={16} /> Open
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2">1002</td>
                  <td className="px-4 py-2">24-07-2025</td>
                  <td className="px-4 py-2 text-green-600 flex items-center gap-2">
                    <Truck size={16} /> Delivered
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2">1002</td>
                  <td className="px-4 py-2">24-07-2025</td>
                  <td className="px-4 py-2 text-green-600 flex items-center gap-2">
                    <Truck size={16} /> Delivered
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2">1002</td>
                  <td className="px-4 py-2">24-07-2025</td>
                  <td className="px-4 py-2 text-green-600 flex items-center gap-2">
                    <Truck size={16} /> Delivered
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2">1002</td>
                  <td className="px-4 py-2">24-07-2025</td>
                  <td className="px-4 py-2 text-green-600 flex items-center gap-2">
                    <Truck size={16} /> Delivered
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Outstanding Payments */}
        <div className="bg-white p-6 rounded-xl shadow-md overflow-x-auto">
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
                <tr>
                  <td className="px-4 py-2">1001</td>
                  <td className="px-4 py-2">25-08-2025</td>
                  <td className="px-4 py-2">RM 3,800</td>
                </tr>
                <tr>
                  <td className="px-4 py-2">1002</td>
                  <td className="px-4 py-2">24-07-2025</td>
                  <td className="px-4 py-2">RM 380</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
