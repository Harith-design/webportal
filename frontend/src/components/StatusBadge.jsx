import React from "react";
import {
  PackageOpen,
  Truck,
  FileBox,
} from "lucide-react";

// Configuration for each status
export const statusConfig = {
  Open: {
    label: "Open",
    icon: <PackageOpen size={16} className="mr-1" />,
    style: {
      background: "radial-gradient(circle at 20% 80%, #b2faffff, #afc9ffff)",
      color: "#007edf",
    },
  },
  Closed: {
    label: "Delivered",
    icon: <Truck size={16} className="mr-1" />,
    style: {
      background: "radial-gradient(circle at 20% 80%, #c9ffa4ff, #89fdbdff)",
      color: "#16aa3dff",
    },
  },
  Pending: {
    label: "Pending",
    icon: <FileBox size={16} className="mr-1" />,
    style: {
      background: "radial-gradient(circle at 20% 80%, #fffaccff, #ffe29aff)",
      color: "#d18e00",
    },
  },
  // Add more statuses here
};

const StatusBadge = ({ status }) => {
  const cfg = statusConfig[status] || statusConfig.Open;
  return (
    <span
      className="inline-flex items-center rounded-xl px-2 text-xs font-medium"
      style={cfg.style}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
};

export default StatusBadge;
