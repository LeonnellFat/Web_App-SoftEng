import { useState } from "react";
import { motion } from "motion/react";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { signUpWithEmail } from "../services/auth";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface CreateAccountPageProps {
  onNavigate: (page: string) => void;
  onLogin: (asAdmin?: boolean, userData?: { fullName: string; email: string; phone: string; address?: string }, userId?: string) => void;
}

export function CreateAccountPage({ onNavigate, onLogin }: CreateAccountPageProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    (async () => {
      try {
        const { user, error } = await signUpWithEmail(email, password, fullName, phone);
        if (error) {
          alert(error.message || 'Failed to create account');
          return;
        }
        // created successfully - update app state
        onLogin(false, { fullName, email, phone, address: "" }, user?.id);
      } catch (err: any) {
        alert(err?.message ?? String(err));
      }
    })();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Back Button */}
          <button
            onClick={() => onNavigate("auth")}
            className="flex items-center gap-2 text-gray-600 hover:text-[#FF69B4] transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name Field */}
            <div className="space-y-2">
              <Label htmlFor="fullname" className="text-gray-700">
                Full Name
              </Label>
              <Input
                id="fullname"
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#FF69B4] focus:ring-2 focus:ring-[#FF69B4]/20"
              />
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#FF69B4] focus:ring-2 focus:ring-[#FF69B4]/20"
              />
            </div>

            {/* Phone Field */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-700">
                Phone
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter your phone number"
                value={phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setPhone(value);
                }}
                onKeyDown={(e) => {
                  if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
                    e.preventDefault();
                  }
                }}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#FF69B4] focus:ring-2 focus:ring-[#FF69B4]/20"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#FF69B4] focus:ring-2 focus:ring-[#FF69B4]/20 pr-12 [&::-ms-reveal]:hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-700">
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#FF69B4] focus:ring-2 focus:ring-[#FF69B4]/20 pr-12 [&::-ms-reveal]:hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Create Account Button */}
            <Button
              type="submit"
              className="w-full bg-[#FF69B4] hover:bg-[#FF1493] text-white py-6 rounded-xl"
            >
              Create Account
            </Button>

            {/* Sign In Link */}
            <p className="text-center text-sm">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => onNavigate("signin")}
                className="text-[#FF69B4] hover:text-[#FF1493]"
              >
                Sign in
              </button>
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
