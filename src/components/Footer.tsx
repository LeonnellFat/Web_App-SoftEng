import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-20">
      <div className="max-w-7xl mx-auto px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* About */}
          <div className="space-y-4 md:max-w-xs">
            <h3
              className="text-2xl font-semibold"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Jean's Flower Shop
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Bringing beauty and joy to every occasion with our stunning flower
              arrangements and gifts.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Quick Links</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Products
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Categories
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  About Us
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Contact Us</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[#FF69B4] flex-shrink-0" />
                <span>0936 047 9432</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#FF69B4] flex-shrink-0" />
                <span>jeanawid.ja@gmail.com</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#FF69B4] flex-shrink-0 mt-0.5" />
                <span>Dr Miciano Rd, Dumaguete City</span>
              </li>
            </ul>
            <div className="flex gap-4 pt-2">
              <a
                href="https://www.facebook.com/jeanawid0/"
                className="text-gray-400 hover:text-[#FF69B4] transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://www.instagram.com/jeanflowershop/?hl=en"
                className="text-gray-400 hover:text-[#FF69B4] transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2025 Jean's Flower Shop. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
