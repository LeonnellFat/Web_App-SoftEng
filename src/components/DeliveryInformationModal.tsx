import { useState } from "react";
import { motion } from "motion/react";
import { X, Phone, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface DeliveryInformationModalProps {
  onClose: () => void;
  onContinue: (deliveryInfo: DeliveryInfo) => void;
  deliveryOption: "delivery" | "pickup";
}

export interface DeliveryInfo {
  fullName?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  phoneNumber?: string;
  specialInstructions?: string;
  pickupTime?: string;
}

export function DeliveryInformationModal({ onClose, onContinue, deliveryOption }: DeliveryInformationModalProps) {
  const [formData, setFormData] = useState<DeliveryInfo>({
    fullName: "",
    address: "",
    city: "",
    zipCode: "",
    phoneNumber: "",
    specialInstructions: "",
    pickupTime: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate pickup time for pickup option
    if (deliveryOption === "pickup" && !formData.pickupTime) {
      return;
    }
    
    onContinue(formData);
  };

  const handleChange = (field: keyof DeliveryInfo, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
            Delivery Information
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {deliveryOption === "pickup" ? (
          /* Pickup Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Store Icon */}
            <div className="flex justify-center mb-4">
              <div className="text-6xl">🏪</div>
            </div>

            {/* Store Pickup Heading */}
            <div className="text-center mb-6">
              <h3 className="text-xl">Store Pickup</h3>
            </div>

            {/* Store Information */}
            <div className="bg-pink-50 border border-pink-100 rounded-lg p-4 space-y-3">
              <h4>Jean's Flower Shop</h4>
              <p className="text-sm text-gray-700">123 Garden Street</p>
              <p className="text-sm text-gray-700">Flower City, FC 12345</p>
              
              <div className="pt-2">
                <p className="text-sm mb-1">Store Hours:</p>
                <p className="text-sm text-gray-700">Mon-Fri: 8:00 AM - 8:00 PM</p>
                <p className="text-sm text-gray-700">Sat-Sun: 9:00 AM - 7:00 PM</p>
              </div>

              <div className="flex items-center gap-2 text-[#FF69B4] pt-2">
                <Phone className="w-4 h-4" />
                <span className="text-sm">Call us: (555) 123-FLOWER</span>
              </div>
            </div>

            {/* Pickup Time Dropdown */}
            <div>
              <label className="block text-sm mb-2">
                Preferred Pickup Time <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.pickupTime}
                onValueChange={(value) => handleChange("pickupTime", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select pickup time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asap">ASAP (30-45 minutes)</SelectItem>
                  <SelectItem value="1-2hours">1-2 hours</SelectItem>
                  <SelectItem value="2-4hours">2-4 hours</SelectItem>
                  <SelectItem value="tomorrow-morning">Tomorrow morning (9-12 PM)</SelectItem>
                  <SelectItem value="tomorrow-afternoon">Tomorrow afternoon (12-5 PM)</SelectItem>
                  <SelectItem value="tomorrow-evening">Tomorrow evening (5-8 PM)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Pickup Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm mb-2">Pickup Instructions:</h4>
                  <ul className="text-xs text-gray-700 space-y-1">
                    <li>• Please bring a valid ID for order verification</li>
                    <li>• We'll send you a text when your order is ready</li>
                    <li>• Orders not picked up within 24 hours may be cancelled</li>
                    <li>• Free parking available in front of the store</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={!formData.pickupTime}
              className="w-full bg-[#FF69B4] hover:bg-[#FF1493] text-white py-6 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Continue
            </Button>
          </form>
        ) : (
          /* Delivery Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <Input
              required
              value={formData.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
              placeholder="Enter your full name"
              className="w-full"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm mb-2">
              Address <span className="text-red-500">*</span>
            </label>
            <Input
              required
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="Street address"
              className="w-full"
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-sm mb-2">
              City <span className="text-red-500">*</span>
            </label>
            <Input
              required
              value={formData.city}
              onChange={(e) => handleChange("city", e.target.value)}
              placeholder="Enter city"
              className="w-full"
            />
          </div>

          {/* ZIP Code */}
          <div>
            <label className="block text-sm mb-2">ZIP Code</label>
            <Input
              value={formData.zipCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                handleChange("zipCode", value);
              }}
              onKeyDown={(e) => {
                if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
                  e.preventDefault();
                }
              }}
              placeholder="Enter ZIP code"
              className="w-full"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm mb-2">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <Input
              required
              value={formData.phoneNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                handleChange("phoneNumber", value);
              }}
              onKeyDown={(e) => {
                if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
                  e.preventDefault();
                }
              }}
              placeholder="Enter phone number"
              className="w-full"
            />
          </div>

          {/* Special Instructions */}
          <div>
            <label className="block text-sm mb-2">Special Instructions</label>
            <Textarea
              value={formData.specialInstructions}
              onChange={(e) => handleChange("specialInstructions", e.target.value)}
              placeholder="Leave at door, ring doorbell, etc."
              className="w-full resize-none"
              rows={3}
            />
          </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-[#FF69B4] hover:bg-[#FF1493] text-white py-6 rounded-lg mt-6"
            >
              Continue
            </Button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
