import { useState, useEffect, useRef } from "react";
import supabase from "../../services/supabaseClient";
import { motion } from "motion/react";
import { Search, Trash2, Check, ChevronDown, X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { toast, Toaster } from "sonner";
import { fetchDrivers, assignDriverToOrder, type Driver } from "../../services/driverService";
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
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driversLoading, setDriversLoading] = useState(true);
  const [assigningDriverTo, setAssigningDriverTo] = useState<string | null>(null);
  const [selectedOrderForItems, setSelectedOrderForItems] = useState<Order | null>(null);
  const subscriptionRef = useRef<any>(null);

  const filteredOrders = orders.filter((order) =>
    Object.values(order).some((value) => {
      if (typeof value === 'string') {
        return value.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return false;
    })
  );

  const handleUpdateStatus = async (orderId: string, newStatus: "Pending" | "Confirmed" | "Preparing" | "Ready" | "OutForDelivery" | "Delivered" | "Completed") => {
    try {
      // Find the order to check its current status
      const order = orders.find(o => o.id === orderId);
      
      // Prevent status change if order is still Pending
      if (order?.status === "Pending") {
        toast.error('Please accept the order first before changing its status');
        return;
      }
      
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

  const handleAcceptOrder = async (orderId: string) => {
    try {
      const toastId = toast.loading('Accepting order...');
      
      // Update status to Confirmed directly
      const { error } = await supabase
        .from('orders')
        .update({ status: 'Confirmed' })
        .eq('id', orderId);

      if (error) throw error;

      // Update local state
      onUpdateOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: 'Confirmed' } : order
      ));

      toast.success('Order accepted! Now you can assign a driver.', {
        id: toastId,
        duration: 2000,
      });
    } catch (err) {
      console.error('Failed to accept order:', err);
      const message = (err && (err.message || err.error_description || err.details)) || 'Failed to accept order. Please try again.';
      const details = err?.details ? String(err.details) : '';
      toast.error(message + (details ? ` — ${details}` : ''), { duration: 5000 });
    }
  };

  const handleAssignDriver = async (orderId: string, driverId: string) => {
    try {
      // Don't submit empty selection
      if (!driverId) {
        return;
      }

      const toastId = toast.loading('Assigning driver...');

      // Find the driver to get their name for local state update
      const selectedDriver = drivers.find(d => d.profileId === driverId);
      if (!selectedDriver) {
        throw new Error('Driver not found');
      }

      // Use the service function - driverId is already the profileId
      const { error } = await assignDriverToOrder(orderId, driverId);

      if (error) throw error;

      // If successful, update local state with driver name and ID
      onUpdateOrders(orders.map(order => 
        order.id === orderId ? { ...order, driver: selectedDriver.name, driverId: selectedDriver.profileId } : order
      ));

      toast.success('Driver assigned successfully', {
        id: toastId,
        duration: 2000,
      });
    } catch (err) {
      console.error('Failed to update driver:', err);
      const message = (err && (err.message || err.error_description || err.details)) || 'Failed to assign driver. Please try again.';
      const details = err?.details ? String(err.details) : '';
      toast.error(message + (details ? ` — ${details}` : ''), { duration: 5000 });
    }
  };

  const handleDeleteOrder = async () => {
    if (!deleteOrderId) return;

    try {
      const toastId = toast.loading('Deleting order...');
      
      console.log('Attempting to delete order with ID:', deleteOrderId);
      
      // Delete order items first (due to foreign key constraint)
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', deleteOrderId);

      if (itemsError) {
        console.error('Error deleting order items:', itemsError);
        throw itemsError;
      }

      console.log('Order items deleted successfully');

      // Then delete the order
      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', deleteOrderId);

      if (orderError) {
        console.error('Error deleting order:', orderError);
        throw orderError;
      }

      console.log('Order deletion query completed. Verifying...');

      // Verify the order was actually deleted by fetching it
      const { data: verifyOrder, error: verifyError } = await supabase
        .from('orders')
        .select('id')
        .eq('id', deleteOrderId)
        .single();

      if (!verifyError && verifyOrder) {
        console.error('Verification failed: Order still exists in database!');
        throw new Error('Order deletion failed - RLS permission issue? Order still exists in database');
      }

      console.log('Order verified deleted');

      // Update local state only AFTER successful deletion verification
      onUpdateOrders(orders.filter(order => order.id !== deleteOrderId));

      toast.success('Order deleted successfully', {
        id: toastId,
        duration: 2000,
      });

      setIsDeleteDialogOpen(false);
      setDeleteOrderId(null);
    } catch (err) {
      console.error('Full delete error:', err);
      const message = (err && (err.message || err.error_description || err.details)) || 'Failed to delete order. Please try again.';
      toast.error(message, { duration: 5000 });
      setIsDeleteDialogOpen(false);
      setDeleteOrderId(null);
    }
  };

  // Fetch orders from Supabase and map to app Order shape
  const fetchOrdersFromDb = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get orders with order_items, user profile, and driver profile info
      const { data: ordersData, error: ordersErr } = await supabase
        .from("orders")
        .select(`*, order_items(*) , profiles:user_id(full_name), driver:driver_id(full_name)`) 
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
      const mapped = (ordersData || []).map((o: any) => {
        // Normalize status values from database to match UI expectations
        let status = o.status ?? 'Pending';
        
        // Normalize all status values: convert lowercase and camelCase to PascalCase
        const statusMap: Record<string, string> = {
          'pending': 'Pending',
          'confirmed': 'Confirmed',
          'preparing': 'Preparing',
          'ready': 'Ready',
          'outfordelivery': 'OutForDelivery',
          'outForDelivery': 'OutForDelivery',
          'delivered': 'Delivered',
          'completed': 'Completed'
        };
        
        const normalizedStatus = statusMap[status.toLowerCase()] || status;
        
        return {
          id: o.id,
          name: o.profiles?.full_name ?? "",
          orderId: o.order_number ?? o.id,
          items: (o.order_items || []).map((it: any) => ({ product: productsMap[it.product_id] ?? { id: it.product_id, name: 'Unknown', price: it.price || 0, image: '' }, quantity: it.quantity })),
          totalAmount: o.total_amount ?? 0,
          phone: o.phone ?? "",
          date: o.date ?? (o.created_at ? o.created_at.split('T')[0] : ""),
          status: normalizedStatus,
          payment: o.payment ?? 'Cash',
          driver: o.driver?.full_name ?? 'Unassigned',
          driverId: o.driver_id,
          deliveryAddress: o.delivery_address ?? '',
          deliveryOption: o.delivery_option ?? 'delivery'
        };
      });

      // Merge DB orders with any existing local/fallback orders so admins don't lose visibility
      const dbIds = new Set(mapped.map((o: any) => o.id));
      const merged = [
        // prefer DB-provided orders first
        ...mapped,
        // keep any local orders that don't exist in DB yet (only orders with UUID format, not timestamp-based IDs)
        ...(orders || []).filter((o) => !dbIds.has(o.id) && o.id.includes('-')),
      ];

      onUpdateOrders(merged);
    } catch (err: any) {
      console.error("Failed to fetch orders from DB", err);
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const loadDrivers = async () => {
    try {
      setDriversLoading(true);
      const driversList = await fetchDrivers();
      setDrivers(driversList);
    } catch (err) {
      console.error("Failed to fetch drivers:", err);
      toast.error('Failed to load drivers', { duration: 3000 });
    } finally {
      setDriversLoading(false);
    }
  };

  useEffect(() => {
    // Load once on mount
    fetchOrdersFromDb();
    loadDrivers();

    // Set up Realtime subscription for order status changes
    const subscription = supabase
      .channel("orders-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: "status=in.(OutForDelivery,Delivered)" // Only subscribe to these status changes
        },
        (payload) => {
          const updatedOrder = payload.new;
          
          // Normalize status values
          let normalizedStatus = updatedOrder.status;
          if (normalizedStatus === "outForDelivery") normalizedStatus = "OutForDelivery";
          
          // Update local state with the new status
          onUpdateOrders(
            orders.map((order) =>
              order.id === updatedOrder.id
                ? { ...order, status: normalizedStatus }
                : order
            )
          );

          // Show notification
          const statusDisplay = normalizedStatus === "OutForDelivery" ? "Out for Delivery" : normalizedStatus;
          toast.success(`Order ${updatedOrder.order_number || updatedOrder.id} status updated to ${statusDisplay}`, {
            duration: 3000,
          });
        }
      )
      .subscribe();

    subscriptionRef.current = subscription;

    // Cleanup subscription on unmount
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
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
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap w-8">#</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Name</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Order Id</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Items</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Amount</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap hidden lg:table-cell">Phone</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Order Date</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Status</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap hidden md:table-cell">Payment</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Option</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap hidden xl:table-cell">Driver</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Action</th>
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
                    <td className="px-3 py-3 text-xs whitespace-nowrap">{index + 1}</td>
                    <td className="px-3 py-3 text-xs whitespace-nowrap font-medium text-gray-700">
                      <span className="truncate max-w-[120px] inline-block" title={order.name}>{order.name}</span>
                    </td>
                    <td className="px-3 py-3 text-xs whitespace-nowrap text-gray-600">{order.orderId}</td>
                    <td className="px-3 py-3 text-xs">
                      <button
                        onClick={() => setSelectedOrderForItems(order)}
                        className="flex items-center gap-1 px-2 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md transition-colors font-medium text-xs whitespace-nowrap"
                        title={`${order.items.length} ${order.items.length === 1 ? 'item' : 'items'}`}
                      >
                        <ChevronDown size={14} />
                        {order.items.length}
                      </button>
                    </td>
                    <td className="px-3 py-3 text-xs whitespace-nowrap font-semibold text-gray-900">₱{order.totalAmount.toFixed(2)}</td>
                    <td className="px-3 py-3 text-xs whitespace-nowrap text-gray-600 hidden lg:table-cell">
                      <span className="truncate max-w-[100px] inline-block" title={order.phone}>{order.phone}</span>
                    </td>
                    <td className="px-3 py-3 text-xs whitespace-nowrap text-gray-600">{order.date}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {order.status === "Pending" ? (
                        <div className="flex flex-col gap-1">
                          <select
                            value={order.status}
                            disabled
                            className="px-2 py-1 rounded-full text-xs border-0 cursor-not-allowed bg-yellow-100 text-yellow-800 font-medium whitespace-nowrap opacity-60"
                          >
                            <option value="Pending">Pending</option>
                          </select>
                          <span className="text-xs text-gray-500 italic">Accept to change</span>
                        </div>
                      ) : (
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateStatus(order.id, e.target.value as any)}
                          className={`px-2 py-1 rounded-full text-xs border-0 cursor-pointer whitespace-nowrap font-medium ${
                            order.status === "Delivered" || order.status === "Completed"
                              ? "bg-green-100 text-green-800"
                              : order.status === "OutForDelivery"
                              ? "bg-orange-100 text-orange-800"
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
                          {order.deliveryOption === "delivery" ? (
                            <>
                              <option value="OutForDelivery">Out For Delivery</option>
                              <option value="Delivered">Delivered</option>
                            </>
                          ) : (
                            <option value="Completed">Completed</option>
                          )}
                        </select>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs whitespace-nowrap text-gray-600 hidden md:table-cell">{order.payment}</td>
                    <td className="px-3 py-3 text-xs whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${
                        order.deliveryOption === 'delivery'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {order.deliveryOption === 'delivery' ? '🚗' : '🏠'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs whitespace-nowrap hidden xl:table-cell">
                      {order.deliveryOption === 'pickup' ? (
                        <span className="text-gray-500 text-xs italic">No driver</span>
                      ) : order.status === "Confirmed" || order.driver !== "Unassigned" ? (
                        <select
                          value={order.driverId || ""}
                          onChange={(e) => handleAssignDriver(order.id, e.target.value)}
                          disabled={driversLoading}
                          className="px-2 py-1 rounded-md text-xs border border-gray-300 cursor-pointer hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="">Select...</option>
                          {drivers.map((driver) => (
                            <option key={driver.id} value={driver.profileId}>
                              {driver.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-gray-500 text-xs italic">Accept order</span>
                      )}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {order.status === "Pending" ? (
                        <button 
                          onClick={() => handleAcceptOrder(order.id)}
                          className="text-green-600 hover:text-green-800 text-xs font-medium flex items-center gap-1 hover:bg-green-50 px-2 py-1 rounded transition-colors"
                          title="Accept order"
                        >
                          <Check size={16} />
                        </button>
                      ) : (
                        <button 
                          onClick={() => {
                            setDeleteOrderId(order.id);
                            setIsDeleteDialogOpen(true);
                          }}
                          className="text-red-500 hover:text-red-700 text-xs font-medium flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                          title="Delete order"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="px-3 sm:px-6 py-12 text-center text-gray-500">
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

      {/* Items Details Modal */}
      {selectedOrderForItems && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Order Items</h2>
              <button
                onClick={() => setSelectedOrderForItems(null)}
                className="p-1 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Order Info Summary */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600">Order ID</p>
                  <p className="font-medium">{selectedOrderForItems.orderId}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Customer</p>
                  <p className="font-medium">{selectedOrderForItems.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Order Date</p>
                  <p className="font-medium">{selectedOrderForItems.date}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Amount</p>
                  <p className="font-medium">₱{selectedOrderForItems.totalAmount.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm mb-3">Items in Order</h3>
              {selectedOrderForItems.items.length > 0 ? (
                <div className="space-y-2">
                  {selectedOrderForItems.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.product.name}</p>
                        <p className="text-xs text-gray-600">Price: ₱{item.product.price.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-blue-600">Qty: {item.quantity}</p>
                        <p className="text-xs text-gray-600">₱{(item.product.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No items in this order</p>
              )}
            </div>

            {/* Total */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Total:</span>
                <span className="text-lg font-bold text-blue-600">₱{selectedOrderForItems.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Close Button */}
            <div className="mt-6">
              <button
                onClick={() => setSelectedOrderForItems(null)}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Order Confirmation Modal */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
            <h2 className="text-lg font-semibold mb-2">Delete Order</h2>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this order? This action cannot be undone.
            </p>
            <div className="bg-gray-100 p-3 rounded mb-6">
              <p className="text-sm text-gray-600">Order ID: {deleteOrderId}</p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setDeleteOrderId(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteOrder}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
