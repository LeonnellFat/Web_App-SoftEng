import { motion } from "motion/react";
import { User, Package, LogOut, MapPin, Mail, Phone, Edit2, ChevronRight, Check, X } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import { Input } from "./ui/input";

interface UserPageProps {
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  userAddress?: string;
  onLogout: () => void;
  onNavigateToOrders?: () => void;
  onUpdateProfile?: (data: { phone?: string; address?: string }) => Promise<void>;
}

export function UserPage({ 
  userName = "Guest User", 
  userEmail = "customer@email.com", 
  userPhone = "09123456789", 
  userAddress = "123 Garden Street, Flower City, Philippines",
  onLogout, 
  onNavigateToOrders,
  onUpdateProfile 
}: UserPageProps) {
  const [editingPhone, setEditingPhone] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [tempPhone, setTempPhone] = useState(userPhone);
  const [tempAddress, setTempAddress] = useState(userAddress);
  const [isSaving, setIsSaving] = useState(false);

  const handleSavePhone = async () => {
    if (tempPhone.trim() === userPhone) {
      setEditingPhone(false);
      return;
    }
    setIsSaving(true);
    try {
      if (onUpdateProfile) {
        await onUpdateProfile({ phone: tempPhone });
      }
      setEditingPhone(false);
    } catch (error) {
      console.error("Error updating phone:", error);
      setTempPhone(userPhone);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAddress = async () => {
    if (tempAddress.trim() === userAddress) {
      setEditingAddress(false);
      return;
    }
    setIsSaving(true);
    try {
      if (onUpdateProfile) {
        await onUpdateProfile({ address: tempAddress });
      }
      setEditingAddress(false);
    } catch (error) {
      console.error("Error updating address:", error);
      setTempAddress(userAddress);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelPhone = () => {
    setTempPhone(userPhone);
    setEditingPhone(false);
  };

  const handleCancelAddress = () => {
    setTempAddress(userAddress);
    setEditingAddress(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* User Profile Section */}
        <div className="bg-gradient-to-br from-pink-50 to-white border border-gray-200 rounded-lg p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-[#FF69B4] rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {userName}
                </h1>
                <p className="text-gray-600">{userEmail}</p>
              </div>
            </div>
            <Button
              onClick={onLogout}
              variant="outline"
              className="border-[#FF69B4] text-[#FF69B4] hover:bg-pink-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </Button>
          </div>

          {/* User Information Cards */}
          <div className="grid gap-4">
            {/* Order History Card */}
            <button
              onClick={onNavigateToOrders}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-left">
                  <h3 className="mb-1">Order History</h3>
                  <p className="text-sm text-gray-600">View your past orders</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#FF69B4] transition-colors" />
            </button>

            {/* Email Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Mail className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-left">
                  <h3 className="mb-1">Email</h3>
                  <p className="text-sm text-gray-600">{userEmail}</p>
                </div>
              </div>
            </div>

            {/* Phone Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-purple-600" />
                </div>
                {editingPhone ? (
                  <div className="flex-1">
                    <h3 className="mb-2">Phone</h3>
                    <div className="flex gap-2 items-center">
                      <Input
                        value={tempPhone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          setTempPhone(value);
                        }}
                        placeholder="Enter phone number"
                        disabled={isSaving}
                        className="text-sm"
                      />
                      <button
                        onClick={handleSavePhone}
                        disabled={isSaving}
                        className="p-2 hover:bg-green-100 rounded-lg transition-colors text-green-600 disabled:opacity-50 flex-shrink-0"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleCancelPhone}
                        disabled={isSaving}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600 disabled:opacity-50 flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-left flex-1">
                    <h3 className="mb-1">Phone</h3>
                    <p className="text-sm text-gray-600">{userPhone}</p>
                  </div>
                )}
                {!editingPhone && (
                  <button
                    onClick={() => setEditingPhone(true)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                  >
                    <Edit2 className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
            </div>

            {/* Address Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-orange-600" />
                </div>
                {editingAddress ? (
                  <div className="flex-1">
                    <h3 className="mb-2">Address</h3>
                    <div className="flex gap-2 items-center">
                      <Input
                        value={tempAddress}
                        onChange={(e) => setTempAddress(e.target.value)}
                        placeholder="Enter your address"
                        disabled={isSaving}
                        className="text-sm"
                      />
                      <button
                        onClick={handleSaveAddress}
                        disabled={isSaving}
                        className="p-2 hover:bg-green-100 rounded-lg transition-colors text-green-600 disabled:opacity-50 flex-shrink-0"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleCancelAddress}
                        disabled={isSaving}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600 disabled:opacity-50 flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-left flex-1">
                    <h3 className="mb-1">Address</h3>
                    <p className="text-sm text-gray-600">{userAddress}</p>
                  </div>
                )}
                {!editingAddress && (
                  <button
                    onClick={() => setEditingAddress(true)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                  >
                    <Edit2 className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
