import { useState } from "react";
import { motion } from "motion/react";
import { ShoppingCart, FileText, Package } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
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
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  // Helper function to get current date in GMT+8 timezone
  const getTodayGMT8 = () => {
    const now = new Date();
    // Get the date in GMT+8 timezone (Philippines time)
    const gmt8Time = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    return new Date(gmt8Time.getFullYear(), gmt8Time.getMonth(), gmt8Time.getDate());
  };

  // Filter orders by date
  const filterOrdersByDate = (filter: TimeFilter) => {
    const today = getTodayGMT8();
    
    // Helper function to parse date string (YYYY-MM-DD) as GMT+8 local date
    const parseGMT8Date = (dateString: string): Date => {
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day);
    };
    
    return orders.filter(order => {
      const orderDate = parseGMT8Date(order.date);
      
      switch (filter) {
        case "today":
          return orderDate.getTime() === today.getTime();
        case "week":
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return orderDate >= weekAgo && orderDate <= today;
        case "month":
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return orderDate >= monthAgo && orderDate <= today;
        case "all":
          return true;
        case "custom":
          if (!customStartDate || !customEndDate) return false;
          const startDate = new Date(customStartDate);
          const endDate = new Date(customEndDate);
          // Include entire end date
          endDate.setDate(endDate.getDate() + 1);
          return orderDate >= startDate && orderDate < endDate;
        default:
          return true;
      }
    });
  };

  const filteredOrders = filterOrdersByDate(revenueFilter);
  
  // Filter for completed revenue (only Delivered and Completed orders)
  const completedOrders = filteredOrders.filter(order => order.status === "Delivered" || order.status === "Completed");
  
  const totalOrders = filteredOrders.length;
  const totalRevenue = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const totalDeliveries = filteredOrders.filter(order => order.status === "Delivered").length;
  const totalPickedUp = filteredOrders.filter(order => order.status === "Completed").length;

  // Pie chart data for delivered vs picked up
  const deliveryModeData = [
    {
      name: "Delivered",
      value: totalDeliveries,
      color: "#3B82F6"
    },
    {
      name: "Picked Up",
      value: totalPickedUp,
      color: "#10B981"
    }
  ];

  // Generate chart data based on time filter
  const generateChartData = () => {
    const today = getTodayGMT8();
    
    // Helper function to parse date string (YYYY-MM-DD) as GMT+8 local date
    const parseGMT8Date = (dateString: string): Date => {
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day);
    };
    
    let dataPoints: { date: string; revenue: number; orders: number }[] = [];
    
    if (revenueFilter === "today") {
      // Show hourly data for today
      for (let i = 0; i < 24; i++) {
        const hour = new Date(today);
        hour.setHours(i);
        const hourEnd = new Date(hour);
        hourEnd.setHours(i + 1);
        
        const hourOrders = completedOrders.filter(order => {
          const orderDate = parseGMT8Date(order.date);
          const orderTime = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate(), 0, 0, 0);
          return orderTime >= hour && orderTime < hourEnd;
        });
        
        dataPoints.push({
          date: `${i}:00`,
          revenue: hourOrders.reduce((sum, order) => sum + order.totalAmount, 0),
          orders: hourOrders.length,
        });
      }
    } else if (revenueFilter === "week") {
      // Show daily data for the week
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateEnd = new Date(date);
        dateEnd.setDate(dateEnd.getDate() + 1);
        
        const dayOrders = completedOrders.filter(order => {
          const orderDate = parseGMT8Date(order.date);
          return orderDate >= date && orderDate < dateEnd;
        });
        
        dataPoints.push({
          date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          revenue: dayOrders.reduce((sum, order) => sum + order.totalAmount, 0),
          orders: dayOrders.length,
        });
      }
    } else if (revenueFilter === "month") {
      // Show daily data for the month
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      
      for (let d = new Date(monthStart); d < monthEnd; d.setDate(d.getDate() + 1)) {
        const dateEnd = new Date(d);
        dateEnd.setDate(dateEnd.getDate() + 1);
        
        const dayOrders = completedOrders.filter(order => {
          const orderDate = parseGMT8Date(order.date);
          return orderDate >= d && orderDate < dateEnd;
        });
        
        dataPoints.push({
          date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: dayOrders.reduce((sum, order) => sum + order.totalAmount, 0),
          orders: dayOrders.length,
        });
      }
    } else if (revenueFilter === "all") {
      // Show monthly data for all time
      const allMonths = new Set<string>();
      completedOrders.forEach(order => {
        const orderDate = parseGMT8Date(order.date);
        const monthKey = `${orderDate.getFullYear()}-${orderDate.getMonth()}`;
        allMonths.add(monthKey);
      });
      
      const sortedMonths = Array.from(allMonths).sort();
      sortedMonths.forEach(monthKey => {
        const [year, month] = monthKey.split('-').map(Number);
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 1);
        
        const monthOrders = completedOrders.filter(order => {
          const orderDate = parseGMT8Date(order.date);
          return orderDate >= monthStart && orderDate < monthEnd;
        });
        
        dataPoints.push({
          date: new Date(year, month).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
          revenue: monthOrders.reduce((sum, order) => sum + order.totalAmount, 0),
          orders: monthOrders.length,
        });
      });
    } else if (revenueFilter === "custom" && customStartDate && customEndDate) {
      // Show daily data for custom range
      const startDate = new Date(customStartDate);
      const endDate = new Date(customEndDate);
      endDate.setDate(endDate.getDate() + 1); // Include entire end date
      
      for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
        const dateEnd = new Date(d);
        dateEnd.setDate(dateEnd.getDate() + 1);
        
        const dayOrders = completedOrders.filter(order => {
          const orderDate = parseGMT8Date(order.date);
          return orderDate >= d && orderDate < dateEnd;
        });
        
        dataPoints.push({
          date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }),
          revenue: dayOrders.reduce((sum, order) => sum + order.totalAmount, 0),
          orders: dayOrders.length,
        });
      }
    }
    
    return dataPoints;
  };

  const chartData = generateChartData();

  const revenueStats = [
    { label: "Total Orders", value: String(totalOrders), color: "from-teal-400 to-teal-500", icon: ShoppingCart },
    { label: "Cash", value: `₱${totalRevenue.toFixed(2)}`, color: "from-yellow-400 to-yellow-500" },
    { label: "No. Delivered", value: String(totalDeliveries), color: "from-green-400 to-green-500", icon: FileText },
    { label: "Orders Picked Up", value: String(totalPickedUp), color: "from-purple-400 to-purple-500", icon: Package },
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
    <div className="flex flex-col gap-4">
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
      
      {/* Date Range Picker - Show only when custom is selected */}
      {activeFilter === "custom" && (
        <div className="flex gap-4 items-end bg-gray-50 p-4 rounded-md">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Start Date</label>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">End Date</label>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          {customStartDate && customEndDate && (
            <div className="text-xs text-gray-600">
              {new Date(customStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - {new Date(customEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          )}
        </div>
      )}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* Revenue Trend Chart and Delivery Mode Distribution */}
      <section className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Revenue Trend Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-lg shadow-md"
          >
            <h2 className="text-xl mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              Revenue Trend
            </h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => {
                    if (typeof value === 'number' && !Number.isInteger(value)) {
                      return `₱${value.toFixed(2)}`;
                    }
                    return value;
                  }}
                  labelFormatter={(label) => `${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#FF69B4" 
                  name="Revenue (₱)"
                  strokeWidth={2}
                  dot={{ fill: '#FF69B4', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="orders" 
                  stroke="#FF9500" 
                  name="Number of Orders"
                  strokeWidth={2}
                  dot={{ fill: '#FF9500', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Delivery Mode Distribution Pie Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-lg shadow-md"
          >
            <h2 className="text-xl mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
              Delivery Mode Distribution
            </h2>
            {deliveryModeData[0].value + deliveryModeData[1].value > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={deliveryModeData}
                    cx="50%"
                    cy="45%"
                    labelLine={false}
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(1)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {deliveryModeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} order(s)`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-gray-500">
                No completed orders data available
              </div>
            )}
          </motion.div>
        </div>
      </section>
      {/* Users and Product Overview sections removed per design */}
    </div>
  );
}
