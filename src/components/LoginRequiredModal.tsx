import { motion } from "motion/react";
import { X, ShoppingBag } from "lucide-react";
import { Button } from "./ui/button";

interface LoginRequiredModalProps {
  onLogin: () => void;
  onSignUp: () => void;
  onClose: () => void;
}

export function LoginRequiredModal({ onLogin, onSignUp, onClose }: LoginRequiredModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-pink-50 rounded-lg p-8 max-w-md w-full mx-4 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-pink-200 rounded-2xl flex items-center justify-center mb-6">
            <ShoppingBag className="w-8 h-8 text-[#FF69B4]" />
          </div>

          {/* Title */}
          <h2 className="text-2xl mb-2 text-[#FF69B4]" style={{ fontFamily: "'Playfair Display', serif" }}>
            Login Required
          </h2>

          {/* Message */}
          <p className="text-gray-600 mb-8">
            Please log in or sign up to order.
          </p>

          {/* Buttons */}
          <div className="w-full space-y-3">
            <Button
              onClick={onLogin}
              className="w-full bg-[#FF69B4] hover:bg-[#FF1493] text-white py-6 rounded-lg"
            >
              <span className="mr-2">⊙</span>
              Login
            </Button>
            <Button
              onClick={onSignUp}
              variant="outline"
              className="w-full border-[#FF69B4] text-[#FF69B4] hover:bg-pink-50 py-6 rounded-lg"
            >
              <span className="mr-2">⊙</span>
              Sign Up
            </Button>
          </div>

          {/* Continue browsing */}
          <button
            onClick={onClose}
            className="mt-6 text-gray-500 hover:text-gray-700 text-sm"
          >
            Continue browsing
          </button>
        </div>
      </motion.div>
    </div>
  );
}
