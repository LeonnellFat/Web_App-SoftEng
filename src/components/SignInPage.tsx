import { useState } from "react";
import { motion } from "motion/react";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { signInWithEmail } from "../services/auth";
import { toast } from "sonner";

interface SignInPageProps {
  onNavigate: (page: string) => void;
  onLogin: (asAdmin?: boolean, userData?: { fullName: string; email: string; phone: string }, userId?: string) => void;
}

export function SignInPage({ onNavigate, onLogin }: SignInPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    (async () => {
      try {
        const { user, profile, error } = await signInWithEmail(email, password);
        if (error) {
          toast.error(error.message || 'Sign in failed');
          return;
        }
        if (!user) {
          toast.error('Sign in failed: no user returned');
          return;
        }

        const asAdmin = profile?.role === 'admin';
        onLogin(asAdmin, {
          fullName: profile?.full_name ?? email.split('@')[0],
          email: profile?.email ?? email,
          phone: profile?.phone ?? '0000000000'
        }, user.id);
        toast.success('Signed in successfully');
      } catch (err: any) {
        toast.error(err?.message || 'Sign in failed');
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

          <form onSubmit={handleSubmit} className="space-y-6">
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
              <p className="text-xs text-gray-500">
                Tip: Use <span className="text-[#FF69B4]">admin@jeans.com</span> to access admin dashboard
              </p>
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
                  placeholder="Enter your password"
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

            {/* Sign In Button */}
            <Button
              type="submit"
              className="w-full bg-[#FF69B4] hover:bg-[#FF1493] text-white py-6 rounded-xl"
            >
              Sign In
            </Button>

            {/* Sign Up Link */}
            <p className="text-center text-sm">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => onNavigate("createaccount")}
                className="text-[#FF69B4] hover:text-[#FF1493]"
              >
                Sign up
              </button>
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
