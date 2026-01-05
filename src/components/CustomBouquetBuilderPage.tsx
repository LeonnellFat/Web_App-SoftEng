import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Sparkles, Check } from "lucide-react";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { toast } from "sonner";
import type { BouquetColor, FlowerType } from "../data/bouquetData";

interface CustomBouquetBuilderPageProps {
  onBack: () => void;
  onAddToCart: (bouquet: any) => void;
  isLoggedIn: boolean;
  onShowLoginRequired: () => void;
  bouquetColors: BouquetColor[];
  flowerTypes: FlowerType[];
}

type BouquetSize = "small" | "medium" | "large" | null;

interface SelectedFlower {
  flower: FlowerType;
  count: number;
}

const sizeOptions = [
  {
    id: "small" as const,
    name: "Small",
    description: "Perfect intimate gesture with 1-2 stems",
    maxFlowers: 2,
    price: 250,
    emoji: "🌸"
  },
  {
    id: "medium" as const,
    name: "Medium",
    description: "Beautiful arrangement with 6 stems",
    maxFlowers: 6,
    price: 600,
    emoji: "💐"
  },
  {
    id: "large" as const,
    name: "Large",
    description: "Stunning display with 12 stems",
    maxFlowers: 12,
    price: 1200,
    emoji: "🌹"
  }
];

export function CustomBouquetBuilderPage({ 
  onBack, 
  onAddToCart, 
  isLoggedIn, 
  onShowLoginRequired,
  bouquetColors,
  flowerTypes
}: CustomBouquetBuilderPageProps) {
  const [selectedSize, setSelectedSize] = useState<BouquetSize>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedFlowers, setSelectedFlowers] = useState<SelectedFlower[]>([]);

  // Filter only available flower types
  const availableFlowers = flowerTypes.filter(flower => flower.available);

  const maxFlowers = sizeOptions.find(s => s.id === selectedSize)?.maxFlowers || 0;
  const totalFlowers = selectedFlowers.reduce((sum, f) => sum + f.count, 0);
  const basePrice = sizeOptions.find(s => s.id === selectedSize)?.price || 0;

  const handleFlowerSelect = (flower: FlowerType) => {
    if (totalFlowers >= maxFlowers) {
      toast.error(`Maximum ${maxFlowers} stems allowed for ${selectedSize} size`);
      return;
    }

    setSelectedFlowers(prev => {
      const existing = prev.find(f => f.flower.id === flower.id);
      if (existing) {
        return prev.map(f => 
          f.flower.id === flower.id 
            ? { ...f, count: f.count + 1 }
            : f
        );
      }
      return [...prev, { flower, count: 1 }];
    });
  };

  const handleFlowerDeselect = (flowerId: string) => {
    setSelectedFlowers(prev => {
      const existing = prev.find(f => f.flower.id === flowerId);
      if (existing && existing.count > 1) {
        return prev.map(f => 
          f.flower.id === flowerId 
            ? { ...f, count: f.count - 1 }
            : f
        );
      }
      return prev.filter(f => f.flower.id !== flowerId);
    });
  };

  const handleAddToCart = () => {
    if (!isLoggedIn) {
      onShowLoginRequired();
      return;
    }

    if (!selectedSize) {
      toast.error("Please select a bouquet size");
      return;
    }
    if (!selectedColor) {
      toast.error("Please select a color theme");
      return;
    }
    if (selectedFlowers.length === 0) {
      toast.error("Please add at least one stem");
      return;
    }

    const customBouquet = {
      id: `custom-${Date.now()}`,
      name: `Custom ${selectedSize.charAt(0).toUpperCase() + selectedSize.slice(1)} Bouquet`,
      price: basePrice,
      image: selectedFlowers[0].flower.image,
      category: "Custom",
      isSpecial: false,
      isBestSeller: false,
      customDetails: {
        size: selectedSize,
        color: selectedColor,
        flowers: selectedFlowers
      }
    };

    onAddToCart(customBouquet);
    toast.success("Custom bouquet added to cart!");
    onBack();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 py-12">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[#FF69B4] hover:text-[#FF1493] mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Categories
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1
                className="text-4xl mb-2"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Custom Bouquet Builder
              </h1>
              <p className="text-gray-600">Design your perfect bouquet</p>
            </div>
          </div>
        </motion.div>

        {/* Choose Your Bouquet Size */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-6 h-6 text-[#FF69B4]" />
            <h2 className="text-2xl" style={{ fontFamily: "'Playfair Display', serif" }}>
              Choose Your Bouquet Size
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {sizeOptions.map((size) => (
              <motion.button
                key={size.id}
                onClick={() => {
                  setSelectedSize(size.id);
                  setSelectedFlowers([]);
                }}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                className={`relative bg-white rounded-2xl p-6 border-2 transition-all text-left ${
                  selectedSize === size.id
                    ? "border-[#FF69B4] shadow-lg"
                    : "border-gray-200 hover:border-pink-200"
                }`}
              >
                {selectedSize === size.id && (
                  <div className="absolute top-4 right-4 w-6 h-6 bg-[#FF69B4] rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
                
                <div className="text-4xl mb-3">{size.emoji}</div>
                <h3 className="text-xl mb-2">{size.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{size.description}</p>
                <div className="inline-block px-3 py-1 bg-gray-100 rounded-full text-sm mb-3">
                  {size.maxFlowers} {size.maxFlowers === 1 ? 'stem' : 'stems'}
                </div>
                <div className="text-2xl text-[#FF69B4]">
                  ₱{size.price}
                  <span className="text-sm text-gray-500 ml-1">Base price</span>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* Choose Bouquet Color Theme */}
        {selectedSize && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-6 h-6 text-[#FF69B4]" />
              <h2 className="text-2xl" style={{ fontFamily: "'Playfair Display', serif" }}>
                Choose Bouquet Color Theme
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {bouquetColors.map((color) => (
                <motion.button
                  key={color.id}
                  onClick={() => setSelectedColor(color.id)}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative bg-white rounded-2xl p-6 border-2 transition-all ${
                    selectedColor === color.id
                      ? "border-[#FF69B4] shadow-lg"
                      : "border-gray-200 hover:border-pink-200"
                  }`}
                >
                  {selectedColor === color.id && (
                    <div className="absolute top-3 right-3 w-5 h-5 bg-[#FF69B4] rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                  
                  <div className="flex flex-col items-center">
                    <div 
                      className="w-16 h-16 rounded-full mb-3 shadow-md"
                      style={{ 
                        backgroundColor: color.hexCode,
                        border: color.hexCode === '#FFFFFF' ? '2px solid #E5E7EB' : 'none'
                      }}
                    ></div>
                    <h3 className="mb-1">{color.name}</h3>
                    <p className="text-xs text-gray-500 text-center">{color.description}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.section>
        )}

        {/* Add Flowers */}
        {selectedSize && selectedColor && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-12"
          >
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-6 h-6 text-[#FF69B4]" />
              <h2 className="text-2xl" style={{ fontFamily: "'Playfair Display', serif" }}>
                Add Flower Stems ({totalFlowers}/{maxFlowers})
              </h2>
            </div>

            {/* Selected Flowers Summary */}
            {selectedFlowers.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border-2 border-[#FF69B4] mb-6">
                <h3 className="mb-4">Selected Stems:</h3>
                <div className="flex flex-wrap gap-3">
                  {selectedFlowers.map((item) => (
                    <div
                      key={item.flower.id}
                      className="flex items-center gap-2 bg-pink-50 px-4 py-2 rounded-full"
                    >
                      <span className="text-sm">{item.flower.name}</span>
                      <span className="text-xs bg-[#FF69B4] text-white px-2 py-0.5 rounded-full">
                        {item.count}
                      </span>
                      <button
                        onClick={() => handleFlowerDeselect(item.flower.id)}
                        className="text-gray-500 hover:text-red-500 ml-1"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Flower Selection Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {availableFlowers.map((flower) => {
                const selectedCount = selectedFlowers.find(f => f.flower.id === flower.id)?.count || 0;
                const isSelected = selectedCount > 0;

                return (
                  <motion.div
                    key={flower.id}
                    whileHover={{ y: -4 }}
                    className={`relative bg-white rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                      isSelected
                        ? "border-[#FF69B4] shadow-lg"
                        : "border-gray-200 hover:border-pink-200"
                    }`}
                    onClick={() => handleFlowerSelect(flower)}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 z-10 w-6 h-6 bg-[#FF69B4] text-white rounded-full flex items-center justify-center text-xs">
                        {selectedCount}
                      </div>
                    )}
                    
                    <div className="aspect-square overflow-hidden">
                      <ImageWithFallback
                        src={flower.image}
                        alt={flower.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-sm text-center truncate">{flower.name}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {availableFlowers.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No flower stems available. Contact admin to add flowers.
              </div>
            )}
          </motion.section>
        )}

        {/* Add to Cart Button */}
        {selectedSize && selectedColor && selectedFlowers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="sticky bottom-6 bg-white rounded-2xl p-6 shadow-xl border-2 border-[#FF69B4]"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Your custom bouquet</p>
                <p className="text-2xl text-[#FF69B4]">₱{basePrice.toFixed(2)}</p>
              </div>
              <Button
                onClick={handleAddToCart}
                className="bg-[#FF69B4] hover:bg-[#FF1493] text-white px-8 py-6 rounded-xl text-lg"
              >
                Add to Cart
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
