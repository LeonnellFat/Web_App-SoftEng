import { motion } from "motion/react";
import { User } from "lucide-react";
import { Button } from "./ui/button";

interface AuthWelcomePageProps {
  onNavigate: (page: string) => void;
}

export function AuthWelcomePage({ onNavigate }: AuthWelcomePageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* User Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 rounded-full bg-pink-100 flex items-center justify-center">
              <User className="w-12 h-12 text-[#FF69B4]" />
            </div>
          </div>

          {/* Welcome Text */}
          <h1
            className="text-center mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Welcome to Jean's Flower Shop
          </h1>
          
          <p className="text-center text-gray-600 mb-8">
            Sign in to access your orders, favorites, and personalized recommendations
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={() => onNavigate("signin")}
              className="w-full bg-[#FF69B4] hover:bg-[#FF1493] text-white py-6 rounded-xl"
            >
              Sign In
            </Button>
            
            <Button
              onClick={() => onNavigate("createaccount")}
              variant="outline"
              className="w-full border-2 border-[#FF69B4] text-[#FF69B4] hover:bg-[#FF69B4] hover:text-white py-6 rounded-xl"
            >
              Create Account
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
