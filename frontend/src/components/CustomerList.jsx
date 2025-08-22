import React, { useEffect, useState } from "react";
import "./AuthOrder.css";

function CustomerList() {
  const [customers, setCustomers] = useState([]);

  // Check login
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) window.location.href = "/login";

    const fetchCustomers = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/customers", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok || response.status === 200) {
          setCustomers(data);
        }
      } catch (error) {
        console.error("Fetch customers error:", error);
      }
    };

    fetchCustomers();
  }, []);

  return (
    <div className="relative min-h-screen flex justify-center items-start p-8 bg-dark-gradient overflow-hidden">
      <div className="flex justify-center items-start p-8 w-full">
        <div className="order-glass-card w-full">
          <h2 className="text-4xl font-bold mb-6 text-center text-neon-purple">
            Customer List
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-neon-purple/30 text-white">
                  <th className="p-2 text-left">Customer ID</th>
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Email</th>
                  <th className="p-2 text-left">Phone</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-neon-purple/10 transition-colors">
                    <td className="p-2">{cust.id}</td>
                    <td className="p-2">{cust.name}</td>
                    <td className="p-2">{cust.email}</td>
                    <td className="p-2">{cust.phone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {customers.length === 0 && <p className="text-center mt-4 text-white">No customers found.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerList;
