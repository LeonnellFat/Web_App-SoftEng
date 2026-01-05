import { motion } from "motion/react";
import { X, Wallet, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { DeliveryInfo } from "./DeliveryInformationModal";
import { Product } from "../data/products";

interface CartItem {
  product: Product;
  quantity: number;
}

interface ConfirmOrderModalProps {
  onClose: () => void;
  onPlaceOrder: () => void;
  onBack: () => void;
  deliveryInfo: DeliveryInfo;
  cartItems: CartItem[];
  total: number;
  deliveryOption: "delivery" | "pickup";
}

export function ConfirmOrderModal({
  onClose,
  onPlaceOrder,
  onBack,
  deliveryInfo,
  cartItems,
  total,
  deliveryOption,
}: ConfirmOrderModalProps) {
  const getPickupTimeLabel = (value: string) => {
    const labels: Record<string, string> = {
      "asap": "ASAP (30-45 minutes)",
      "1-2hours": "1-2 hours",
      "2-4hours": "2-4 hours",
      "tomorrow-morning": "Tomorrow morning (9-12 PM)",
      "tomorrow-afternoon": "Tomorrow afternoon (12-5 PM)",
      "tomorrow-evening": "Tomorrow evening (5-8 PM)",
    };
    return labels[value] || value;
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl text-[#FF69B4]" style={{ fontFamily: "'Playfair Display', serif" }}>
            Confirm Order
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Payment Method */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="mb-1">Cash Payment</h3>
                <p className="text-sm text-gray-600">Pay when you receive your order</p>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <h3 className="mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              Order Summary
            </h3>
            <div className="space-y-3 text-sm">
              {deliveryOption === "pickup" ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pickup Time:</span>
                    <span className="text-right">{getPickupTimeLabel(deliveryInfo.pickupTime || "")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="text-right">Jean's Flower Shop</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery to:</span>
                    <span className="text-right">{deliveryInfo.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Address:</span>
                    <span className="text-right max-w-[200px]">
                      {deliveryInfo.address}, {deliveryInfo.city}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span>{deliveryInfo.phoneNumber}</span>
                  </div>
                </>
              )}

              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span>Total Amount:</span>
                  <span className="text-xl text-[#FF69B4]">₱{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Instructions */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm mb-2">Payment Instructions:</h4>
                <ul className="text-xs text-gray-700 space-y-1">
                  {deliveryOption === "pickup" ? (
                    <>
                      <li>• Please prepare exact change if possible</li>
                      <li>• Payment will be collected upon pickup</li>
                      <li>• Cash only - no credit/debit cards accepted</li>
                    </>
                  ) : (
                    <>
                      <li>• Please prepare exact change if possible</li>
                      <li>• Payment will be collected upon delivery</li>
                      <li>• Cash only - no credit/debit cards accepted</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={onBack}
              variant="outline"
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 py-6"
            >
              Back
            </Button>
            <Button
              onClick={onPlaceOrder}
              className="flex-1 bg-[#FF69B4] hover:bg-[#FF1493] text-white py-6"
            >
              <Wallet className="w-4 h-4 mr-2" />
              Place Order
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
