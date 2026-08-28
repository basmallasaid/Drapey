// Centralized order status metadata — used by StatusBadge and the Orders Overview chart
// so badge and chart color definitions never diverge.

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
];

export const STATUS_META = {
  pending:    { label: "Pending",    badge: "bg-[#FEF9C3] text-[#713F12]", fill: "#FDE68A" },
  confirmed:  { label: "Confirmed",  badge: "bg-[#DBEAFE] text-[#1E40AF]", fill: "#BFDBFE" },
  preparing:  { label: "Preparing",  badge: "bg-[#FFEDD5] text-[#9A3412]", fill: "#FED7AA" },
  shipped:    { label: "Shipped",    badge: "bg-[#E0E7FF] text-[#3730A3]", fill: "#C7D2FE" },
  delivered:  { label: "Delivered",  badge: "bg-[#DCFCE7] text-[#166534]", fill: "#BBF7D0" },
  cancelled:  { label: "Cancelled",  badge: "bg-[#FEE2E2] text-[#991B1B]", fill: "#FECACA" },
};
