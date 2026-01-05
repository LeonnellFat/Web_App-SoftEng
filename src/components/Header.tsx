import { ShoppingCart, User } from "lucide-react";
import { Button } from "./ui/button";

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isLoggedIn: boolean;
  onLogin: () => void;
  onUserClick: () => void;
  onCartClick: () => void;
  cartItemCount: number;
}

export function Header({ currentPage, onNavigate, isLoggedIn, onLogin, onUserClick, onCartClick, cartItemCount }: HeaderProps) {
  const navItems = [
    { name: "HOME", id: "home" },
    { name: "PRODUCTS", id: "products" },
    { name: "CATEGORIES", id: "categories" },
    { name: "ABOUT", id: "about" },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-full mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo - Far Left */}
            <button
              onClick={() => onNavigate("home")}
              className="flex items-center flex-shrink-0"
            >
              <h1
                className="text-3xl whitespace-nowrap"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Jean's Flower Shop
              </h1>
            </button>

            {/* Navigation - Center */}
            <nav className="flex items-center gap-8 flex-1 justify-center mx-8">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`text-sm font-medium tracking-wide transition-colors ${
                    currentPage === item.id
                      ? "text-[#FF69B4]"
                      : "text-gray-700 hover:text-[#FF69B4]"
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </nav>

            {/* Right section - Far Right */}
            <div className="flex items-center gap-6 flex-shrink-0">
              {isLoggedIn && (
                <>
                  <button onClick={onUserClick} className="relative hover:text-[#FF69B4] transition-colors">
                    <User className="w-5 h-5 text-gray-700 hover:text-[#FF69B4]" />
                  </button>
                  <button onClick={onCartClick} className="relative hover:text-[#FF69B4] transition-colors">
                    <ShoppingCart className="w-5 h-5 text-gray-700 hover:text-[#FF69B4]" />
                    {cartItemCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-[#FF69B4] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {cartItemCount}
                      </span>
                    )}
                  </button>
                </>
              )}
              {!isLoggedIn && (
                <Button
                  className="bg-[#FF69B4] hover:bg-[#FF1493] text-white px-6 py-2 rounded-md flex-shrink-0"
                  onClick={onLogin}
                >
                  Log In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
