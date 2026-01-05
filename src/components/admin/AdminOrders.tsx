import { useState, useEffect } from "react";
import supabase from "../../services/supabaseClient";
import { motion } from "motion/react";
import { Search } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { toast, Toaster } from "sonner";
import type { Order } from "../../App";

interface AdminOrdersProps {
  orders: Order[];
  onUpdateOrders: (orders: Order[]) => void;
}

export function AdminOrders({ orders, onUpdateOrders }: AdminOrdersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredOrders = orders.filter((order) =>
    Object.values(order).some((value) => {
      if (typeof value === 'string') {
        return value.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return false;
    })
  );

  const handleUpdateStatus = async (orderId: string, newStatus: "Pending" | "Confirmed" | "Preparing" | "Ready" | "Delivered") => {
    try {
      // Show loading toast
      const toastId = toast.loading('Updating order status...');
      
      // First update in Supabase (don't send updated_at from client)
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      // If successful, update local state
      onUpdateOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));

      // Show success message
      toast.success('Order status updated successfully', {
        id: toastId,
        duration: 2000,
      });
    } catch (err) {
        console.error('Failed to update order status:', err);
        // Try to extract useful information from Supabase error object
        const message = (err && (err.message || err.error_description || err.details)) || 'Failed to update order status. Please try again.';
        const details = err?.details ? String(err.details) : '';
        toast.error(message + (details ? ` — ${details}` : ''), { duration: 5000 });
    }
  };

  const handleAssignDriver = async (orderId: string, driverName: string) => {
    try {
      // First update in Supabase
      const { error } = await supabase
        .from('orders')
        .update({ driver_id: driverName })
        .eq('id', orderId);

      if (error) throw error;

      // If successful, update local state
      onUpdateOrders(orders.map(order => 
        order.id === orderId ? { ...order, driver: driverName } : order
      ));
    } catch (err) {
      console.error('Failed to update driver:', err);
      // You might want to show an error toast here
    }
  };

  // Fetch orders from Supabase and map to app Order shape
  const fetchOrdersFromDb = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get orders with order_items and basic profile info
      const { data: ordersData, error: ordersErr } = await supabase
        .from("orders")
        .select(`*, order_items(*) , profiles:user_id(full_name)`) 
        .order("created_at", { ascending: false });

      if (ordersErr) throw ordersErr;

      // Collect all product ids from items to fetch product details
      const allProductIds = new Set<string>();
      (ordersData || []).forEach((o: any) => {
        (o.order_items || []).forEach((it: any) => allProductIds.add(it.product_id));
      });

      let productsMap: Record<string, any> = {};
      if (allProductIds.size > 0) {
        const ids = Array.from(allProductIds);
        const { data: products } = await supabase.from("products").select("id,name,price,image").in("id", ids);
        (products || []).forEach((p: any) => { productsMap[p.id] = p; });
      }

      // Map to local Order shape
      const mapped = (ordersData || []).map((o: any) => ({
        id: o.id,
        name: o.profiles?.full_name ?? "",
        orderId: o.order_number ?? o.id,
        items: (o.order_items || []).map((it: any) => ({ product: productsMap[it.product_id] ?? { id: it.product_id, name: 'Unknown', price: it.price || 0, image: '' }, quantity: it.quantity })),
        totalAmount: o.total_amount ?? 0,
        phone: o.phone ?? "",
        date: o.date ?? (o.created_at ? o.created_at.split('T')[0] : ""),
        status: o.status ?? 'Pending',
        payment: o.payment ?? 'Cash',
        driver: o.driver_id ?? 'Unassigned',
        deliveryAddress: o.delivery_address ?? '',
        deliveryOption: o.delivery_option ?? 'delivery'
      }));

      // Merge DB orders with any existing local/fallback orders so admins don't lose visibility
      const dbIds = new Set(mapped.map((o: any) => o.id));
      const merged = [
        // prefer DB-provided orders first
        ...mapped,
        // keep any local orders that don't exist in DB yet
        ...(orders || []).filter((o) => !dbIds.has(o.id)),
      ];

      onUpdateOrders(merged);
    } catch (err: any) {
      console.error("Failed to fetch orders from DB", err);
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load once on mount
    fetchOrdersFromDb();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
            Orders
          </h1>
          <p className="text-gray-600">Manage and track all orders</p>
        </div>
        <div className="flex gap-3">
          <Button className="bg-[#FF69B4] hover:bg-[#FF1493] text-white">
            View All Orders
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Show</span>
            <select
              value={entriesPerPage}
              onChange={(e) => setEntriesPerPage(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md bg-white"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-gray-600">entries</span>
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg border border-gray-200 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm text-gray-600">#</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Name</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Order Id</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Items</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Amount</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Phone</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Order Date</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Status</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Payment</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Driver</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order, index) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm">{index + 1}</td>
                    <td className="px-6 py-4 text-sm">{order.name}</td>
                    <td className="px-6 py-4 text-sm">{order.orderId}</td>
                    <td className="px-6 py-4 text-sm">
                      {order.items.map(item => item.product.name).join(", ")}
                    </td>
                    <td className="px-6 py-4 text-sm">₱{order.totalAmount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm">{order.phone}</td>
                    <td className="px-6 py-4 text-sm">{order.date}</td>
                    <td className="px-6 py-4">
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateStatus(order.id, e.target.value as any)}
                        className={`px-3 py-1 rounded-full text-xs border-0 cursor-pointer ${
                          order.status === "Delivered"
                            ? "bg-green-100 text-green-800"
                            : order.status === "Ready"
                            ? "bg-blue-100 text-blue-800"
                            : order.status === "Preparing"
                            ? "bg-purple-100 text-purple-800"
                            : order.status === "Confirmed"
                            ? "bg-teal-100 text-teal-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Preparing">Preparing</option>
                        <option value="Ready">Ready</option>
                        <option value="Delivered">Delivered</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm">{order.payment}</td>
                    <td className="px-6 py-4 text-sm">{order.driver}</td>
                    <td className="px-6 py-4">
                      <button className="text-[#FF69B4] hover:text-[#FF1493] text-sm">
                        View
                      </button>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-gray-500">
                    No orders available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Showing {filteredOrders.length > 0 ? 1 : 0} to {filteredOrders.length} of {filteredOrders.length} entries
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50">
              Previous
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50">
              Next
            </button>
          </div>
        </div>
      </motion.div>
      
      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
}
