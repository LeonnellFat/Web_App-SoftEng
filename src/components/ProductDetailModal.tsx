import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ShoppingCart, Heart } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Button } from "./ui/button";
import { toast } from "sonner";
import type { Product } from "../data/products";

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart?: (product: Product, quantity?: number) => void;
  isLoggedIn?: boolean;
  onShowLoginRequired?: () => void;
}

export function ProductDetailModal({ product, onClose, onAddToCart, isLoggedIn = false, onShowLoginRequired }: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const handleIncrement = () => {
    setQuantity(prev => prev + 1);
  };

  const handleDecrement = () => {
    setQuantity(prev => Math.max(1, prev - 1));
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3 }}
          className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6 text-gray-700" />
          </button>

          <div className="grid md:grid-cols-2 gap-8 p-8">
            {/* Image Section */}
            <div className="relative">
              <div className="relative aspect-square rounded-lg overflow-hidden">
                <ImageWithFallback
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {product.badge && (
                  <div className="absolute top-4 left-4 bg-[#FF69B4] text-white px-4 py-2 rounded-full">
                    {product.badge}
                  </div>
                )}
              </div>

              {/* Additional product images would go here */}
              <div className="grid grid-cols-4 gap-2 mt-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-[#FF69B4] cursor-pointer transition-colors"
                  >
                    <ImageWithFallback
                      src={product.image}
                      alt={`${product.name} view ${i}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Details Section */}
            <div className="flex flex-col">
              <div className="flex-1">
                <h2
                  className="text-3xl mb-2"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {product.name}
                </h2>

                {/* Categories */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {product.categories.map((category, index) => (
                    <span
                      key={index}
                      className="text-sm bg-pink-50 text-[#FF69B4] px-3 py-1 rounded-full"
                    >
                      {category}
                    </span>
                  ))}
                </div>

                {/* Price */}
                <div className="mb-6">
                  <span className="text-3xl text-[#FF69B4]">
                    ₱{product.price.toFixed(2)}
                  </span>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h3 className="mb-2">Description</h3>
                  <p className="text-gray-600">
                    A beautiful handcrafted bouquet perfect for any occasion. Each arrangement
                    is carefully designed by our expert florists using the freshest flowers
                    available. This stunning creation combines elegance with vibrant colors to
                    express your feelings perfectly.
                  </p>
                </div>

                {/* Features */}
                <div className="mb-6">
                  <h3 className="mb-2">Features</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-[#FF69B4] rounded-full"></span>
                      Fresh, hand-selected flowers
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-[#FF69B4] rounded-full"></span>
                      Same-day delivery available
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-[#FF69B4] rounded-full"></span>
                      Includes personalized message card
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-[#FF69B4] rounded-full"></span>
                      Professional arrangement and packaging
                    </li>
                  </ul>
                </div>

                {/* Quantity Selector */}
                <div className="mb-6">
                  <h3 className="mb-2">Quantity</h3>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={handleDecrement}
                      className="w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      -
                    </button>
                    <span className="w-16 text-center">{quantity}</span>
                    <button 
                      onClick={handleIncrement}
                      className="w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 border-t">
                <Button
                  onClick={() => {
                    if (!isLoggedIn) {
                      if (onShowLoginRequired) {
                        onShowLoginRequired();
                      }
                      onClose();
                      return;
                    }
                    if (onAddToCart) {
                      onAddToCart(product, quantity);
                      toast.success(`${quantity} ${product.name} added to cart!`, {
                        duration: 2000,
                      });
                      onClose();
                    }
                  }}
                  className="flex-1 bg-[#FF69B4] hover:bg-[#FF1493] text-white py-6"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart
                </Button>
                <Button
                  variant="outline"
                  className="p-6 border-[#FF69B4] text-[#FF69B4] hover:bg-[#FF69B4] hover:text-white"
                >
                  <Heart className="w-5 h-5" />
                </Button>
              </div>

              {/* Additional info */}
              <div className="mt-6 p-4 bg-pink-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  🚚 Order before 5:00 PM for same-day delivery
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
