import { motion } from "motion/react";
import { Truck, User, Phone, Lock, FileText, CheckCircle, Trash2, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { toast } from "sonner";
import { createDriver, fetchDrivers, updateDriver, deleteDriver } from "../../services/driverService";
import type { Driver } from "../../services/driverService";

export function AdminDrivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [creatingDriver, setCreatingDriver] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    username: "",
    vehicleNumber: "",
    licenseNumber: "",
  });

  // Fetch drivers on mount
  useEffect(() => {
    loadDrivers();
  }, []);

  async function loadDrivers() {
    setLoading(true);
    setError(null);
    try {
      const driversData = await fetchDrivers();
      setDrivers(driversData);
    } catch (err: any) {
      console.error("Error fetching drivers:", err);
      setError(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }

  const handleAddDriver = async () => {
    // Validation
    if (
      !formData.email ||
      !formData.password ||
      !formData.fullName ||
      !formData.phone ||
      !formData.username ||
      !formData.vehicleNumber
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Validate password strength
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    // Validate username (alphanumeric, underscore, dash only)
    if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      toast.error("Username can only contain letters, numbers, underscores, and dashes");
      return;
    }

    setCreatingDriver(true);
    try {
      const newDriver = await createDriver({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        phone: formData.phone,
        username: formData.username,
        vehicleNumber: formData.vehicleNumber,
        licenseNumber: formData.licenseNumber || undefined,
      });

      // Refresh drivers list
      const driverData = await fetchDrivers();
      setDrivers(driverData);

      toast.success(`Driver "${formData.fullName}" created successfully!`);
      setFormData({
        email: "",
        password: "",
        fullName: "",
        phone: "",
        username: "",
        vehicleNumber: "",
        licenseNumber: "",
      });
      setShowAddForm(false);
    } catch (err: any) {
      console.error("Error creating driver:", err);
      toast.error(err?.message || "Failed to create driver account");
    } finally {
      setCreatingDriver(false);
    }
  };

  const handleToggleStatus = async (driver: Driver) => {
    try {
      const newStatus = driver.status === "active" ? "inactive" : "active";
      await updateDriver(driver.id, { status: newStatus });

      // Update local state
      setDrivers(
        drivers.map((d) =>
          d.id === driver.id ? { ...d, status: newStatus } : d
        )
      );

      toast.success(`Driver status updated to ${newStatus}`);
    } catch (err: any) {
      console.error("Error updating driver status:", err);
      toast.error("Failed to update driver status");
    }
  };

  const handleToggleAvailability = async (driver: Driver) => {
    try {
      const newAvailability = !driver.isAvailable;
      await updateDriver(driver.id, { isAvailable: newAvailability });

      // Update local state
      setDrivers(
        drivers.map((d) =>
          d.id === driver.id ? { ...d, isAvailable: newAvailability } : d
        )
      );

      toast.success(
        `Driver ${newAvailability ? "is now available" : "is no longer available"}`
      );
    } catch (err: any) {
      console.error("Error updating driver availability:", err);
      toast.error("Failed to update driver availability");
    }
  };

  const handleDeleteDriver = async (driver: Driver) => {
    if (!window.confirm(`Are you sure you want to delete driver "${driver.name}"?`)) {
      return;
    }

    try {
      await deleteDriver(driver.profileId);
      setDrivers(drivers.filter((d) => d.id !== driver.id));
      toast.success("Driver deleted successfully");
    } catch (err: any) {
      console.error("Error deleting driver:", err);
      toast.error("Failed to delete driver");
    }
  };

  const handleEditDriver = (driver: Driver) => {
    setEditingDriver(driver);
    setFormData({
      email: driver.email,
      password: "",
      fullName: driver.name,
      phone: driver.phone,
      username: driver.username,
      vehicleNumber: driver.vehicleNumber,
      licenseNumber: driver.licenseNumber || "",
    });
    setShowAddForm(true);
  };

  const activeDrivers = drivers.filter((d) => d.status === "active").length;
  const totalDeliveries = drivers.reduce((sum, d) => sum + d.deliveries, 0);
  const avgRating =
    drivers.length > 0
      ? (drivers.reduce((sum, d) => sum + d.rating, 0) / drivers.length).toFixed(1)
      : "0.0";

  if (loading && drivers.length === 0) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading drivers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
            Delivery Drivers
          </h1>
          <p className="text-gray-600">Manage your delivery team</p>
        </div>
        <Button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setEditingDriver(null);
          }}
          className="bg-[#FF69B4] hover:bg-[#FF1493] text-white"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Driver
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-green-400 to-green-500 p-6 rounded-lg text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <Truck className="w-12 h-12 opacity-80" />
          </div>
          <div className="text-4xl mb-2">{activeDrivers}</div>
          <div className="text-white/90">Active Drivers</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-400 to-blue-500 p-6 rounded-lg text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <FileText className="w-12 h-12 opacity-80" />
          </div>
          <div className="text-4xl mb-2">{totalDeliveries}</div>
          <div className="text-white/90">Total Deliveries</div>
        </motion.div>
      </div>

      {/* Add Driver Form */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white border border-gray-200 rounded-lg p-6 mb-6"
        >
          <h3 className="text-xl mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Create New Driver Account
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="e.g., Juan Dela Cruz"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g., driver@example.com"
              />
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    username: e.target.value.toLowerCase().replace(/\s+/g, "_"),
                  })
                }
                placeholder="e.g., juan_driver"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setFormData({ ...formData, phone: value });
                }}
                onKeyDown={(e) => {
                  if (
                    !/[0-9]/.test(e.key) &&
                    e.key !== "Backspace" &&
                    e.key !== "Delete" &&
                    e.key !== "Tab"
                  ) {
                    e.preventDefault();
                  }
                }}
                placeholder="e.g., 09123456789"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Min 6 characters"
              />
            </div>

            {/* Vehicle Number */}
            <div className="space-y-2">
              <Label htmlFor="vehicleNumber">Vehicle Number/Plate *</Label>
              <Input
                id="vehicleNumber"
                value={formData.vehicleNumber}
                onChange={(e) =>
                  setFormData({ ...formData, vehicleNumber: e.target.value.toUpperCase() })
                }
                placeholder="e.g., ABC-1234"
              />
            </div>

            {/* License Number */}
            <div className="space-y-2">
              <Label htmlFor="licenseNumber">Driver License Number</Label>
              <Input
                id="licenseNumber"
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                placeholder="e.g., DL123456789"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleAddDriver}
              disabled={creatingDriver}
              className="bg-[#FF69B4] hover:bg-[#FF1493] text-white"
            >
              {creatingDriver ? "Creating..." : "Create Driver Account"}
            </Button>
            <Button
              onClick={() => {
                setShowAddForm(false);
                setFormData({
                  email: "",
                  password: "",
                  fullName: "",
                  phone: "",
                  username: "",
                  vehicleNumber: "",
                  licenseNumber: "",
                });
              }}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </motion.div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Drivers List */}
      <div className="grid grid-cols-1 gap-4">
        {drivers.map((driver, index) => (
          <motion.div
            key={driver.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex gap-4 flex-1">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-[#FF69B4]" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">{driver.name}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        driver.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {driver.status === "active" ? "Active" : "Inactive"}
                    </span>
                    {driver.isAvailable && (
                      <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                        Available
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-gray-600 mt-4">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-mono">{driver.username}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{driver.phone}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Truck className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{driver.vehicleNumber}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-gray-600 mt-4">
                    <div className="text-sm">
                      <span className="text-gray-500 font-medium">Email:</span>
                      <div className="truncate">{driver.email}</div>
                    </div>
                    {driver.licenseNumber && (
                      <div className="text-sm">
                        <span className="text-gray-500 font-medium">License:</span>
                        <div>{driver.licenseNumber}</div>
                      </div>
                    )}
                    <div className="text-sm">
                      <span className="text-gray-500 font-medium">Deliveries:</span>
                      <div>{driver.deliveries}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleToggleAvailability(driver)}
                  className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                  title={driver.isAvailable ? "Mark unavailable" : "Mark available"}
                >
                  <CheckCircle
                    className={`w-5 h-5 ${
                      driver.isAvailable ? "text-blue-600" : "text-gray-400"
                    }`}
                  />
                </button>
                <button
                  onClick={() => handleToggleStatus(driver)}
                  className={`p-2 rounded-lg transition-colors ${
                    driver.status === "active"
                      ? "hover:bg-red-50"
                      : "hover:bg-green-50"
                  }`}
                  title={driver.status === "active" ? "Deactivate" : "Activate"}
                >
                  <Lock
                    className={`w-5 h-5 ${
                      driver.status === "active"
                        ? "text-red-600"
                        : "text-gray-400"
                    }`}
                  />
                </button>
                <button
                  onClick={() => handleDeleteDriver(driver)}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete driver"
                >
                  <Trash2 className="w-5 h-5 text-red-600" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {drivers.length === 0 && !showAddForm && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No drivers found. Add your first driver to get started.</p>
        </div>
      )}
    </div>
  );
}
