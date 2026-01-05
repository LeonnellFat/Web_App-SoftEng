import { useState } from "react";
import { motion } from "motion/react";
import { ShoppingCart, FileText } from "lucide-react";
import { products } from "../../data/products";
import type { Order } from "../../App";

interface AdminReportsProps {
  orders: Order[];
}

type TimeFilter = "today" | "week" | "month" | "all" | "custom";

export function AdminReports({ orders }: AdminReportsProps) {
  const [revenueFilter, setRevenueFilter] = useState<TimeFilter>("today");
  const [userFilter, setUserFilter] = useState<TimeFilter>("today");
  const [productFilter, setProductFilter] = useState<TimeFilter>("today");

  // Filter orders by date
  const filterOrdersByDate = (filter: TimeFilter) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return orders.filter(order => {
      const orderDate = new Date(order.date);
      
      switch (filter) {
        case "today":
          return orderDate >= today;
        case "week":
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return orderDate >= weekAgo;
        case "month":
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return orderDate >= monthAgo;
        case "all":
          return true;
        default:
          return true;
      }
    });
  };

  const filteredOrders = filterOrdersByDate(revenueFilter);
  
  const totalOrders = filteredOrders.length;
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const totalDeliveries = filteredOrders.filter(order => order.status === "Delivered").length;

  const revenueStats = [
    { label: "Total Orders", value: String(totalOrders), color: "from-teal-400 to-teal-500", icon: ShoppingCart },
    { label: "Cash", value: `₱${totalRevenue.toFixed(2)}`, color: "from-yellow-400 to-yellow-500" },
    { label: "No. of Deliveries", value: String(totalDeliveries), color: "from-green-400 to-green-500", icon: FileText },
  ];

  // users section removed per design
  const userStats: any[] = [];

  // Get top products sorted by price (highest) and lowest products
  const sortedByPrice = [...products].sort((a, b) => b.price - a.price);
  const topProducts = [
    { 
      name: sortedByPrice[0]?.name || "N/A", 
      price: `₱${sortedByPrice[0]?.price?.toFixed(2) || "0.00"}`, 
      sold: "0 unit(s) sold", 
      type: "top", 
      color: "bg-green-100 text-green-800" 
    },
    { 
      name: sortedByPrice[sortedByPrice.length - 1]?.name || "N/A", 
      price: `₱${sortedByPrice[sortedByPrice.length - 1]?.price?.toFixed(2) || "0.00"}`, 
      sold: "0 unit(s) sold", 
      type: "lowest", 
      color: "bg-red-100 text-red-800" 
    },
  ];

  const TimeFilterButtons = ({ activeFilter, onFilterChange }: { activeFilter: TimeFilter, onFilterChange: (filter: TimeFilter) => void }) => (
    <div className="flex gap-2">
      <button 
        onClick={() => onFilterChange("today")}
        className={`px-4 py-2 rounded-md text-sm ${activeFilter === "today" ? "bg-[#FF69B4] text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
      >
        Today
      </button>
      <button 
        onClick={() => onFilterChange("week")}
        className={`px-4 py-2 rounded-md text-sm ${activeFilter === "week" ? "bg-[#FF69B4] text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
      >
        This Week
      </button>
      <button 
        onClick={() => onFilterChange("month")}
        className={`px-4 py-2 rounded-md text-sm ${activeFilter === "month" ? "bg-[#FF69B4] text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
      >
        This Month
      </button>
      <button 
        onClick={() => onFilterChange("all")}
        className={`px-4 py-2 rounded-md text-sm ${activeFilter === "all" ? "bg-[#FF69B4] text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
      >
        All Time
      </button>
      <button 
        onClick={() => onFilterChange("custom")}
        className={`px-4 py-2 rounded-md text-sm ${activeFilter === "custom" ? "bg-[#FF69B4] text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
      >
        Date Wise
      </button>
    </div>
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
          Reports
        </h1>
        <p className="text-gray-600">Dashboard overview and analytics</p>
      </div>

      {/* Revenue Overview */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl" style={{ fontFamily: "'Playfair Display', serif" }}>
            Revenue Overview
          </h2>
          <TimeFilterButtons activeFilter={revenueFilter} onFilterChange={setRevenueFilter} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {revenueStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-gradient-to-br ${stat.color} p-6 rounded-lg text-white`}
              >
                <div className="flex items-center justify-between mb-4">
                  {stat.label === 'Cash' ? (
                    <span className="text-4xl opacity-80">₱</span>
                  ) : (
                    Icon && <Icon className="w-12 h-12 opacity-80" />
                  )}
                </div>
                <div className="text-4xl mb-2">{stat.value}</div>
                <div className="text-white/90">{stat.label}</div>
              </motion.div>
            );
          })}
        </div>
      </section>
      {/* Users and Product Overview sections removed per design */}
    </div>
  );
}
