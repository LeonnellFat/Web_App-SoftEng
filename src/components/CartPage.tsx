import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Trash2, Minus, Plus, MapPin, Clock } from "lucide-react";
import { Button } from "./ui/button";
import { Product } from "../data/products";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { DeliveryInformationModal, DeliveryInfo } from "./DeliveryInformationModal";
import { ConfirmOrderModal } from "./ConfirmOrderModal";

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartPageProps {
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, newQuantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: (selectedProductIds: string[], deliveryInfo?: any) => void;
}

export function CartPage({ cartItems, onUpdateQuantity, onRemoveItem, onCheckout }: CartPageProps) {
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null);
  const [selectedDeliveryOption, setSelectedDeliveryOption] = useState<"delivery" | "pickup">("delivery");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set(cartItems.map(item => item.product.id)));

  // Update selectedItems when new items are added to cart
  useEffect(() => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      cartItems.forEach(item => {
        if (!prev.has(item.product.id)) {
          newSet.add(item.product.id);
        }
      });
      // Remove items that are no longer in cart
      prev.forEach(id => {
        if (!cartItems.find(item => item.product.id === id)) {
          newSet.delete(id);
        }
      });
      return newSet;
    });
  }, [cartItems]);

  const handleToggleItem = (productId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.size === cartItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(cartItems.map(item => item.product.id)));
    }
  };

  const selectedCartItems = cartItems.filter(item => selectedItems.has(item.product.id));

  const subtotal = selectedCartItems.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );

  const deliveryFee = selectedDeliveryOption === "delivery" ? 59 : 0;
  const total = subtotal + deliveryFee;

  const handleProceedToCheckout = () => {
    setShowDeliveryModal(true);
  };

  const handleDeliveryInfoSubmit = (info: DeliveryInfo) => {
    setDeliveryInfo(info);
    setShowDeliveryModal(false);
    setShowConfirmModal(true);
  };

  const handlePlaceOrder = () => {
    setShowConfirmModal(false);
    onCheckout(Array.from(selectedItems), {
      ...deliveryInfo,
      deliveryOption: selectedDeliveryOption
    });
  };

  const handleBackToDelivery = () => {
    setShowConfirmModal(false);
    setShowDeliveryModal(true);
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl text-[#FF69B4] mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                Shopping Cart
              </h1>
              <p className="text-[#FF69B4]">
                {cartItems.length} {cartItems.length === 1 ? "item" : "items"} in your cart
              </p>
            </div>
            {cartItems.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="text-sm text-gray-600 hover:text-[#FF69B4] transition-colors"
              >
                {selectedItems.size === cartItems.length ? "Deselect All" : "Select All"}
              </button>
            )}
          </div>
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">Your cart is empty</p>
            <p className="text-gray-400">Start adding some beautiful flowers!</p>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="space-y-4">
              {cartItems.map((item) => (
                <motion.div
                  key={item.product.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`bg-white border rounded-lg p-4 transition-all ${
                    selectedItems.has(item.product.id) 
                      ? 'border-[#FF69B4] shadow-sm' 
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.product.id)}
                      onChange={() => handleToggleItem(item.product.id)}
                      className="w-5 h-5 text-[#FF69B4] border-gray-300 rounded focus:ring-[#FF69B4] cursor-pointer"
                    />

                    {/* Product Image */}
                    <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                      <ImageWithFallback
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1">
                      <h3 className="mb-1">{item.product.name}</h3>
                      <p className="text-[#FF69B4]">₱{item.product.price.toFixed(2)}</p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3 bg-gray-100 rounded px-3 py-2">
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                        className="text-gray-600 hover:text-[#FF69B4]"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                        className="text-gray-600 hover:text-[#FF69B4]"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => onRemoveItem(item.product.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Delivery Options */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                Delivery Options
              </h2>
              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="delivery"
                    checked={selectedDeliveryOption === "delivery"}
                    onChange={() => setSelectedDeliveryOption("delivery")}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span>Home Delivery</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Same day delivery - ₱59.00
                    </p>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="delivery"
                    checked={selectedDeliveryOption === "pickup"}
                    onChange={() => setSelectedDeliveryOption("pickup")}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span>Store Pickup</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Ready in 30-45 minutes - Free
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      <MapPin className="w-3 h-3 inline mr-1" />
                      123 Garden Street, Flower City
                    </p>
                    <p className="text-xs text-gray-500">
                      <Clock className="w-3 h-3 inline mr-1" />
                      Mon-Fri: 8AM-8PM | Sat-Sun: 9AM-7PM
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                Order Summary
              </h2>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-gray-600 text-sm">
                  <span>Selected Items</span>
                  <span>{selectedItems.size} of {cartItems.length}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₱{subtotal.toFixed(2)}</span>
                </div>
                {deliveryFee > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery Fee</span>
                    <span>₱{deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between">
                  <span>Total</span>
                  <span className="text-xl text-[#FF69B4]">₱{total.toFixed(2)}</span>
                </div>
              </div>
              <Button
                onClick={handleProceedToCheckout}
                disabled={selectedItems.size === 0}
                className="w-full bg-[#FF69B4] hover:bg-[#FF1493] text-white py-6 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <span className="mr-2">⊞</span>
                Proceed to Checkout ({selectedItems.size} {selectedItems.size === 1 ? 'item' : 'items'})
              </Button>
            </div>
          </>
        )}
      </motion.div>

      {/* Modals */}
      {showDeliveryModal && (
        <DeliveryInformationModal
          onClose={() => setShowDeliveryModal(false)}
          onContinue={handleDeliveryInfoSubmit}
          deliveryOption={selectedDeliveryOption}
        />
      )}

      {showConfirmModal && deliveryInfo && (
        <ConfirmOrderModal
          onClose={() => setShowConfirmModal(false)}
          onPlaceOrder={handlePlaceOrder}
          onBack={handleBackToDelivery}
          deliveryInfo={deliveryInfo}
          cartItems={selectedCartItems}
          total={total}
          deliveryOption={selectedDeliveryOption}
        />
      )}
    </div>
  );
}
