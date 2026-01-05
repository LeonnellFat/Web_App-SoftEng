import { useState } from "react";
import { LayoutDashboard, ShoppingBag, Package, Calendar, Truck, LogOut, ChevronDown, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AdminLayoutProps {
  children: React.ReactNode;
  currentSection: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
}

export function AdminLayout({ children, currentSection, onSectionChange, onLogout }: AdminLayoutProps) {
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);

  const navItems = [
    { id: "reports", label: "Reports", icon: LayoutDashboard },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "products", label: "Products", icon: Package },
    { id: "drivers", label: "Drivers", icon: Truck },
  ];

  const categoryItems = [
    { id: "bouquet-colors", label: "Bouquet Color" },
    { id: "categories", label: "Categories" },
    { id: "flower-types", label: "Flower Type" },
  ];

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar - Fixed */}
      <aside className="w-64 bg-[#3d4f5f] text-white flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="p-6 border-b border-white/10 flex-shrink-0">
          <h1
            className="text-2xl"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Jean's Flowers
          </h1>
          <p className="text-sm text-white/60 mt-1">Admin Dashboard</p>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 p-4 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentSection === item.id;
            
            return (
              <motion.button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                whileHover={{ x: 4 }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                  isActive
                    ? "bg-[#FF69B4] text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </motion.button>
            );
          })}

          {/* Categories with Collapsible Sub-items */}
          <div className="mb-2">
            <motion.button
              onClick={() => setCategoriesExpanded(!categoriesExpanded)}
              whileHover={{ x: 4 }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                categoryItems.some(item => currentSection === item.id)
                  ? "bg-[#FF69B4] text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span className="flex-1 text-left">Categories</span>
              {categoriesExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </motion.button>

            {/* Sub-items */}
            <AnimatePresence>
              {categoriesExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  {categoryItems.map((item) => {
                    const isActive = currentSection === item.id;
                    
                    return (
                      <motion.button
                        key={item.id}
                        onClick={() => onSectionChange(item.id)}
                        whileHover={{ x: 4 }}
                        className={`w-full flex items-center gap-3 pl-12 pr-4 py-2 rounded-lg mt-1 transition-colors ${
                          isActive
                            ? "bg-[#FF1493] text-white"
                            : "text-white/60 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                        <span className="text-sm">{item.label}</span>
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        {/* Logout - Fixed at bottom */}
        <div className="p-4 border-t border-white/10 flex-shrink-0">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content - Scrollable */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
