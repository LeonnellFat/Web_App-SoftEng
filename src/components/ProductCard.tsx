import { ImageWithFallback } from "./figma/ImageWithFallback";
import { motion } from "motion/react";
import type { Product } from "../data/products";

interface ProductCardProps extends Product {
  onClick?: () => void;
}

export function ProductCard({ name, price, image, badge, onClick }: ProductCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all group cursor-pointer"
      onClick={onClick}
    >
      <div className="relative aspect-square overflow-hidden">
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.4 }}
        >
          <ImageWithFallback
            src={image}
            alt={name}
            className="w-full h-full object-cover"
          />
        </motion.div>
        {badge && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute top-3 left-3 bg-[#FF69B4] text-white px-3 py-1 rounded-full text-sm"
          >
            {badge}
          </motion.div>
        )}
        {/* Hover overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 bg-gradient-to-t from-[#FF69B4]/20 to-transparent pointer-events-none"
        />
        {/* View Details on hover */}
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <span className="bg-white text-[#FF69B4] px-6 py-2 rounded-full shadow-lg">
            View Details
          </span>
        </motion.div>
      </div>
      <div className="p-4">
        <h3 className="mb-2">{name}</h3>
        <span className="text-[#FF69B4]">₱{price.toFixed(2)}</span>
      </div>
    </motion.div>
  );
}
