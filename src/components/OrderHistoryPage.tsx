import { motion } from "motion/react";
import { Package, MapPin, Calendar, ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useState, useEffect } from "react";
import supabase from "../services/supabaseClient";

type DatabaseOrder = {
  id: string;
  order_number: string;
  date: string;
  status: string;
  delivery_address: string | null;
  total_amount: number;
  order_items: {
    quantity: number;
    price: number;
    products: {
      name: string;
      image_url: string;
    };
  }[];
}

interface Order {
  id: string;
  orderNumber?: string;
  date: string;
  status: string;
  items: {
    name: string;
    image: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  deliveryAddress: string;
}

interface OrderHistoryPageProps {
  onBack: () => void;
}

type SupabaseProduct = {
  name: string;
  image_url: string;
};

type SupabaseOrderItem = {
  quantity: number;
  price: number;
  products: SupabaseProduct;
};

type SupabaseOrder = {
  id: string;
  order_number: string;
  date: string;
  status: string;
  delivery_address: string | null;
  total_amount: number;
  order_items: SupabaseOrderItem[];
};

export function OrderHistoryPage({ onBack }: OrderHistoryPageProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch orders
        const { data: ordersData, error } = await supabase
          .from('orders')
          .select(`
            id,
            order_number,
            date,
            status,
            delivery_address,
            total_amount,
            order_items (
              quantity,
              price,
              products (
                name,
                image_url
              )
            )
          `)
          .eq('user_id', user.id)
          .order('date', { ascending: false });

        if (error) throw error;

        if (!ordersData) return;

        // Transform data to match our interface (use DB id as primary key)
        const transformedOrders: Order[] = (ordersData as unknown as SupabaseOrder[]).map(order => ({
          id: order.id,
          orderNumber: order.order_number || order.id,
          date: new Date(order.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          status: order.status,
          items: order.order_items?.map(item => ({
            name: item.products?.name ?? 'Unknown Product',
            image: item.products?.image_url ?? '',
            quantity: item.quantity ?? 0,
            price: item.price ?? 0
          })) ?? [],
          total: order.total_amount,
          deliveryAddress: order.delivery_address || ''
        }));

        setOrders(transformedOrders);
      } catch (err) {
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();

    // Subscribe to realtime changes for this user's orders and refresh when they occur
    let channel: any;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        channel = supabase
          .channel(`orders-user-${user.id}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` }, (payload) => {
            // Re-fetch user's orders when anything changes (insert/update/delete)
            fetchOrders();
          })
          .subscribe();
      } catch (e) {
        console.error('Failed to subscribe to order changes', e);
      }
    })();

    return () => {
      try {
        if (channel) supabase.removeChannel(channel);
      } catch (e) {
        // ignore
      }
    };
  }, []);

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "Delivered":
        return "bg-green-100 text-green-800";
      case "Processing":
        return "bg-yellow-100 text-yellow-800";
      case "Shipped":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            onClick={onBack}
            variant="outline"
            className="border-gray-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-[#FF69B4]" />
            <h1 className="text-3xl" style={{ fontFamily: "'Playfair Display', serif" }}>
              Order History
            </h1>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No orders yet</p>
            <p className="text-gray-400 text-sm mt-2">
              Start shopping to see your orders here
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* Order Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-sm text-gray-500">Order ID</p>
                        <p>{order.id}</p>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">{order.date}</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-6">
                  <div className="space-y-4 mb-4">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                          <ImageWithFallback
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="mb-1">{item.name}</p>
                          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                        </div>
                        <p className="text-[#FF69B4]">₱{item.price.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>

                  {/* Delivery Address */}
                  <div className="border-t border-gray-200 pt-4 mb-4">
                    <div className="flex items-start gap-2 text-gray-600">
                      <MapPin className="w-4 h-4 mt-1" />
                      <div>
                        <p className="text-sm">Delivery Address</p>
                        <p className="text-sm">{order.deliveryAddress}</p>
                      </div>
                    </div>
                  </div>

                  {/* Order Total */}
                  <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                    <span className="text-gray-600">Order Total</span>
                    <span className="text-xl text-[#FF69B4]">₱{order.total.toFixed(2)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
