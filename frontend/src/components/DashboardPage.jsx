import React from "react";
import {
  ShoppingCart,
  ClockAlert,
  ClockFading,
  Flag,
  CircleEllipsis,
  Truck,
} from "lucide-react";

function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Row 1 - Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[
          {
            title: "Total Orders",
            value: "201",
            icon: <ShoppingCart size={20} color="blue" />,
            bg: "radial-gradient(circle at 30% 70%, #cfdfffff, #fffbf7ff)",
          },
          {
            title: "Past Due",
            value: "RM 2,100.50",
            icon: <ClockAlert size={20} color="#e63946" />,
            bg: "radial-gradient(circle at 30% 70%, #ffd7d7ff, #f8faffff)",
          },
          {
            title: "Due Soon",
            value: "RM 369.22",
            icon: <ClockFading size={20} color="green" />,
            bg: "radial-gradient(circle at 30% 70%, #9ce9d9ff, #fefff7ff)",
          },
          {
            title: "Total Outstanding",
            value: "RM 1,568.50",
            icon: <Flag size={20} color="#d2e318ff" />,
            bg: "radial-gradient(circle at 30% 70%, #f8fcd0ff, #fdfcfdff)",
          },
        ].map((card) => (
          <div
            key={card.title}
            className="bg-white p-4 rounded-xl shadow-md min-h-30 w-full max-w-xs"
            style={{ background: card.bg }}
          >
            <div className="flex justify-between items-center">
              <h3 className="text-lg">{card.title}</h3>
              <div className="text-gray-600">{card.icon}</div>
            </div>
            <p className="font-semibold text-2xl mt-2">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Row 2 - Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white p-6 rounded-xl shadow-md overflow-x-auto">
          <h3 className="text-lg mb-4">Recent Orders</h3>
          <div className="min-w-[400px]">
            <table className="table-auto w-full border-collapse">
              <thead>
                <tr className="text-left text-sm text-gray-500">
                  <th className="px-4 py-2 font-normal">Sales Number</th>
                  <th className="px-4 py-2 font-normal">Order Date</th>
                  <th className="px-4 py-2 font-normal">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
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
                <tr className="text-left text-sm text-gray-500">
                  <th className="px-4 py-2 font-normal">Invoice Number</th>
                  <th className="px-4 py-2 font-normal">Due Date</th>
                  <th className="px-4 py-2 font-normal">Amount</th>
                </tr>
              </thead>
              <tbody className="text-sm">
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
