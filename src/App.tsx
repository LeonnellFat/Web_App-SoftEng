import { useState, useEffect } from "react";
import supabase from "./services/supabaseClient";
import { fetchUserCart, addToCart, updateCartQuantity, removeFromCart, clearUserCart } from "./services/cartService";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { HomePage } from "./components/HomePage";
import { ProductsPage } from "./components/ProductsPage";
import { CategoriesPage } from "./components/CategoriesPage";
import { AboutPage } from "./components/AboutPage";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { AuthWelcomePage } from "./components/AuthWelcomePage";
import { SignInPage } from "./components/SignInPage";
import { CreateAccountPage } from "./components/CreateAccountPage";
import { UserPage } from "./components/UserPage";
import { CartPage } from "./components/CartPage";
import { OrderHistoryPage } from "./components/OrderHistoryPage";
import { CustomBouquetBuilderPage } from "./components/CustomBouquetBuilderPage";
import { LoginRequiredModal } from "./components/LoginRequiredModal";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import type { Category, Product } from "./data/products";
import { initialBouquetColors, initialFlowerTypes } from "./data/bouquetData";
import type { BouquetColor, FlowerType } from "./data/bouquetData";

interface CartItem {
  product: Product;
  quantity: number;
}

interface UserData {
  fullName: string;
  email: string;
  phone: string;
  address?: string;
}

export interface Order {
  id: string;
  name: string;
  orderId: string;
  items: CartItem[];
  totalAmount: number;
  phone: string;
  date: string;
  status: "Pending" | "Confirmed" | "Preparing" | "Ready" | "Delivered";
  payment: "Cash" | "Card";
  driver: string;
  deliveryAddress?: string;
  deliveryOption: "delivery" | "pickup";
}

export default function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showLoginRequired, setShowLoginRequired] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [userData, setUserData] = useState<UserData>({
    fullName: "Guest User",
    email: "guest@email.com",
    phone: "0000000000",
    address: ""
  });
  const [bouquetColors, setBouquetColors] = useState<BouquetColor[]>(initialBouquetColors);
  const [flowerTypes, setFlowerTypes] = useState<FlowerType[]>(initialFlowerTypes);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Load bouquet colors and flower types from Supabase on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: colors, error: colorsErr } = await supabase
          .from('bouquet_colors')
          .select('id, name, hex_code, description')
          .order('name', { ascending: true });
        if (colorsErr) throw colorsErr;
        const mappedColors = (colors || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          hexCode: c.hex_code ?? '',
          description: c.description ?? ''
        }));

        const { data: flowers, error: flowersErr } = await supabase
          .from('flower_types')
          .select('id, name, image, category, available')
          .order('name', { ascending: true });
        if (flowersErr) throw flowersErr;
        const mappedFlowers = (flowers || []).map((f: any) => ({
          id: f.id,
          name: f.name,
          image: f.image ?? '',
          category: f.category ?? '',
          available: f.available ?? true
        }));

        if (!mounted) return;
        setBouquetColors(mappedColors);
        setFlowerTypes(mappedFlowers);
      } catch (err) {
        console.error('Failed to load admin data', err);
      }
    })();

    return () => { mounted = false; };
  }, []);

  const handleNavigate = (page: string, category?: Category) => {
    setCurrentPage(page);
    setSelectedProduct(null); // Clear product detail when navigating
    // Scroll to top when navigating
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (category) {
      setSelectedCategory(category);
    } else if (page !== "products") {
      setSelectedCategory(null);
    }
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleCloseProductDetail = () => {
    setSelectedProduct(null);
  };

  const handleLogin = (asAdmin: boolean = false, newUserData?: UserData, id?: string) => {
    setIsLoggedIn(true);
    setIsAdmin(asAdmin);
    if (id) {
      setUserId(id);
      // Load user's cart from database
      (async () => {
        try {
          const cartData = await fetchUserCart(id);
          if (cartData.length === 0) {
            setCartItems([]);
            return;
          }
          
          // Fetch products from Supabase to match cart items
          const { data: productsFromDb } = await supabase
            .from('products')
            .select('*');
          
          const mappedItems: CartItem[] = [];
          cartData.forEach(item => {
            const product = productsFromDb?.find(p => p.id === item.product_id);
            if (product) {
              mappedItems.push({
                product: {
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  image: product.image || '',
                  categories: product.categories ? [product.categories] : [],
                  badge: product.badge
                },
                quantity: item.quantity
              });
            }
          });
          setCartItems(mappedItems);
        } catch (err) {
          console.error('Failed to load cart:', err);
        }
      })();
    }
    if (newUserData) {
      setUserData(newUserData);
    } else if (asAdmin) {
      // Admin login
      setUserData({
        fullName: "Admin",
        email: "admin@jeans.com",
        phone: "0000000000"
      });
    }
    if (asAdmin) {
      setCurrentPage("admin");
    } else {
      setCurrentPage("home");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsAdmin(false);
    setUserId(null);
    setCartItems([]);
    setCurrentPage("home");
    setUserData({
      fullName: "Guest User",
      email: "guest@email.com",
      phone: "0000000000",
      address: ""
    });
  };

  const handleAuthNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const handleAddToCart = async (product: Product, quantity: number = 1) => {
    setCartItems((prev) => {
      const existingItem = prev.find((item) => item.product.id === product.id);
      if (existingItem) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    
    // Sync to database if logged in
    if (userId) {
      const existingItem = cartItems.find((item) => item.product.id === product.id);
      if (existingItem) {
        await updateCartQuantity(userId, product.id, existingItem.quantity + quantity);
      } else {
        await addToCart(userId, product.id, quantity);
      }
    }
  };

  const handleUpdateQuantity = async (productId: string, newQuantity: number) => {
    // Prevent negative quantities
    if (newQuantity < 1) return;
    
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
    
    // Sync to database if logged in
    if (userId) {
      await updateCartQuantity(userId, productId, newQuantity);
    }
  };

  const handleRemoveFromCart = async (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
    
    // Sync to database if logged in
    if (userId) {
      await removeFromCart(userId, productId);
    }
  };

  const handleCartClick = () => {
    if (isLoggedIn) {
      setCurrentPage("cart");
    } else {
      setShowLoginRequired(true);
    }
  };

  const handleUserClick = () => {
    if (isLoggedIn) {
      setCurrentPage("user");
    }
  };

  const handleCheckout = async (selectedProductIds: string[], deliveryInfo?: any) => {
    // Get the selected items
    const selectedItems = cartItems.filter((item) => selectedProductIds.includes(item.product.id));

    // Compute totals
    const total = selectedItems.reduce((total, item) => total + item.product.price * item.quantity, 0) + (deliveryInfo?.deliveryOption === "delivery" ? 59 : 0);

    // Try to persist the order to Supabase
    try {
      // 1. Get current user session (must be signed in for RLS to allow INSERT)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setShowLoginRequired(true);
        toast.error('Please sign in to place your order.');
        throw new Error('No authenticated session');
      }

      // 2. Verify user has a profile (required for orders.user_id foreign key)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        toast.error('Account setup incomplete. Please try signing out and back in.');
        throw new Error('No user profile found');
      }

      // Build order payload (user_id should match profiles.id)
      const orderPayload: any = {
        user_id: user?.id ?? null,
        order_number: `ORD-${String((orders?.length ?? 0) + 1).padStart(3, '0')}`,
        total_amount: Math.round(total),
        phone: userData.phone,
        date: new Date().toISOString().split('T')[0],
        status: 'Pending',
        payment: 'Cash',
        delivery_address: deliveryInfo?.address || null,
        delivery_option: deliveryInfo?.deliveryOption || 'delivery'
      };

      const { data: insertedOrder, error: orderErr } = await supabase.from('orders').insert([orderPayload]).select().single();
      if (orderErr) throw orderErr;

      // Insert order_items
      const orderId = insertedOrder.id;
      const itemsPayload = selectedItems.map(si => ({
        order_id: orderId,
        product_id: si.product.id,
        quantity: si.quantity,
        price: Math.round(si.product.price)
      }));

      if (itemsPayload.length) {
        const { error: itemsErr } = await supabase.from('order_items').insert(itemsPayload);
        if (itemsErr) throw itemsErr;
      }

      // Build local order shape for UI (use returned id and created_at)
      const newOrder: Order = {
        id: insertedOrder.id,
        name: userData.fullName,
        orderId: insertedOrder.order_number || insertedOrder.id,
        items: selectedItems,
        totalAmount: total,
        phone: userData.phone,
        date: insertedOrder.date || new Date().toISOString().split('T')[0],
        status: insertedOrder.status ?? 'Pending',
        payment: insertedOrder.payment ?? 'Cash',
        driver: 'Unassigned',
        deliveryAddress: insertedOrder.delivery_address ?? '',
        deliveryOption: insertedOrder.delivery_option ?? 'delivery'
      };

      // Add order to orders list
      setOrders((prev) => [...prev, newOrder]);

      // Remove only selected items from cart
      setCartItems((prev) => prev.filter((item) => !selectedProductIds.includes(item.product.id)));
      
      // Sync cart to database - remove sold items
      if (userId) {
        for (const productId of selectedProductIds) {
          await removeFromCart(userId, productId);
        }
      }
      
      setCurrentPage("home");
      toast.success("Order placed successfully! Thank you for your purchase.", { duration: 3000 });
    } catch (err: any) {
      console.error('Failed to persist order', err);
      // Show a clearer message to the user when persistence fails
      const message = err?.message || (err?.error && err.error.message) || 'Failed to persist order to server';
      try { toast.error(message); } catch { /* ignore toast failures */ }
      // Fallback: still add to local state so admin can see it, but warn the user
      const fallbackOrder: Order = {
        id: String(Date.now()),
        name: userData.fullName,
        orderId: `ORD-${String((orders?.length ?? 0) + 1).padStart(3, '0')}`,
        items: selectedItems,
        totalAmount: total,
        phone: userData.phone,
        date: new Date().toISOString().split('T')[0],
        status: 'Pending',
        payment: 'Cash',
        driver: 'Unassigned',
        deliveryAddress: deliveryInfo?.address || '',
        deliveryOption: deliveryInfo?.deliveryOption || 'delivery'
      };
      setOrders((prev) => [...prev, fallbackOrder]);
      setCartItems((prev) => prev.filter((item) => !selectedProductIds.includes(item.product.id)));
      setCurrentPage('home');
      toast.error('Order saved locally but failed to persist to the server. Please try again or contact support.');
    }
  };

  const renderPage = () => {
    // If admin, show admin dashboard
    if (isAdmin && currentPage === "admin") {
      return <AdminDashboard onLogout={handleLogout} orders={orders} onUpdateOrders={setOrders} bouquetColors={bouquetColors} onUpdateBouquetColors={setBouquetColors} flowerTypes={flowerTypes} onUpdateFlowerTypes={setFlowerTypes} />;
    }

    // Auth pages
    if (currentPage === "auth") {
      return <AuthWelcomePage onNavigate={handleAuthNavigate} />;
    }
    if (currentPage === "signin") {
      return <SignInPage onNavigate={handleAuthNavigate} onLogin={handleLogin} />;
    }
    if (currentPage === "createaccount") {
      return <CreateAccountPage onNavigate={handleAuthNavigate} onLogin={handleLogin} />;
    }

    switch (currentPage) {
      case "home":
        return <HomePage onNavigate={handleNavigate} onProductClick={handleProductClick} selectedProduct={selectedProduct} onCloseProductDetail={handleCloseProductDetail} onAddToCart={handleAddToCart} isLoggedIn={isLoggedIn} onShowLoginRequired={() => setShowLoginRequired(true)} />;
      case "products":
        return <ProductsPage selectedCategory={selectedCategory} onClearCategory={() => setSelectedCategory(null)} onNavigate={handleNavigate} onProductClick={handleProductClick} selectedProduct={selectedProduct} onCloseProductDetail={handleCloseProductDetail} onAddToCart={handleAddToCart} isLoggedIn={isLoggedIn} onShowLoginRequired={() => setShowLoginRequired(true)} />;
      case "categories":
        return <CategoriesPage onNavigate={handleNavigate} />;
      case "about":
        return <AboutPage />;
      case "custom-bouquet":
        return <CustomBouquetBuilderPage onBack={() => handleNavigate("categories")} onAddToCart={handleAddToCart} isLoggedIn={isLoggedIn} onShowLoginRequired={() => setShowLoginRequired(true)} bouquetColors={bouquetColors} flowerTypes={flowerTypes} />;
      case "user":
        return <UserPage 
          userName={userData.fullName} 
          userEmail={userData.email} 
          userPhone={userData.phone} 
          userAddress={userData.address || ""}
          onLogout={handleLogout} 
          onNavigateToOrders={() => setCurrentPage("orders")}
          onUpdateProfile={async (data) => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) throw new Error("Not authenticated");
              
              const updateData: any = {};
              if (data.phone) updateData.phone = data.phone;
              if (data.address !== undefined) updateData.address = data.address;
              
              const { error } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', user.id);
              
              if (error) throw error;
              
              // Update local state
              setUserData(prev => ({
                ...prev,
                ...(data.phone && { phone: data.phone }),
                ...(data.address !== undefined && { address: data.address })
              }));
              
              toast.success("Profile updated successfully!");
            } catch (err: any) {
              console.error("Error updating profile:", err);
              toast.error(err?.message || "Failed to update profile");
              throw err;
            }
          }}
        />;
      case "orders":
        return <OrderHistoryPage onBack={() => setCurrentPage("user")} />;
      case "cart":
        return <CartPage cartItems={cartItems} onUpdateQuantity={handleUpdateQuantity} onRemoveItem={handleRemoveFromCart} onCheckout={handleCheckout} />;
      default:
        return <HomePage onNavigate={handleNavigate} onProductClick={handleProductClick} selectedProduct={selectedProduct} onCloseProductDetail={handleCloseProductDetail} onAddToCart={handleAddToCart} isLoggedIn={isLoggedIn} onShowLoginRequired={() => setShowLoginRequired(true)} />;
    }
  };

  // Show admin dashboard without header/footer if admin
  if (isAdmin && currentPage === "admin") {
    return (
      <div className="min-h-screen">
        {renderPage()}
      </div>
    );
  }

  // Auth welcome page also gets header/footer now
  // All auth pages now show header/footer

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        currentPage={currentPage} 
        onNavigate={handleNavigate} 
        isLoggedIn={isLoggedIn} 
        onLogin={() => setCurrentPage("auth")}
        onUserClick={handleUserClick}
        onCartClick={handleCartClick}
        cartItemCount={cartItems.reduce((total, item) => total + item.quantity, 0)}
      />
      <main className="flex-1">{renderPage()}</main>
      <Footer />
      
      {/* Login Required Modal */}
      {showLoginRequired && (
        <LoginRequiredModal
          onLogin={() => {
            setShowLoginRequired(false);
            setCurrentPage("auth");
          }}
          onSignUp={() => {
            setShowLoginRequired(false);
            setCurrentPage("createaccount");
          }}
          onClose={() => setShowLoginRequired(false)}
        />
      )}

      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
}