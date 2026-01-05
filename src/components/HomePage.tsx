import { useState, useEffect } from "react";
import { ProductCard } from "./ProductCard";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { ProductDetailModal } from "./ProductDetailModal";
import { motion } from "motion/react";
import supabase from "../services/supabaseClient";
import type { Category, Product } from "../data/products";

interface HomePageProps {
  onNavigate: (page: string, category?: Category) => void;
  onProductClick: (product: Product) => void;
  selectedProduct: Product | null;
  onCloseProductDetail: () => void;
  onAddToCart?: (product: Product) => void;
  isLoggedIn?: boolean;
  onShowLoginRequired?: () => void;
}

export function HomePage({ onNavigate, onProductClick, selectedProduct, onCloseProductDetail, onAddToCart, isLoggedIn, onShowLoginRequired }: HomePageProps) {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allCategories, setAllCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedOccasion, setSelectedOccasion] = useState<Category | null>(null);

  useEffect(() => { fetchProducts(); /* eslint-disable-next-line */ }, []);

  async function fetchProducts() {
    try {
      const { data: prodData, error: prodErr } = await supabase.from('products').select('*');
      if (prodErr) {
        console.error('Error loading products', prodErr);
        setAllProducts([]);
        return;
      }
      const prods = (prodData ?? []) as any[];

      const { data: catsData } = await supabase.from('categories').select('*');
      const cats = (catsData ?? []) as { id: string; name: string }[];
      const catMap: Record<string, string> = {};
      cats.forEach((c) => (catMap[c.id] = c.name));

      const prodIds = prods.map((p) => p.id);
      let pcData: any[] = [];
      if (prodIds.length) {
        const { data: pc } = await supabase.from('product_categories').select('*').in('product_id', prodIds);
        pcData = pc ?? [];
      }

      const mapped: Product[] = prods.map((p) => {
        const catsForP = pcData.filter((r) => r.product_id === p.id).map((r) => catMap[r.category_id]).filter(Boolean) as Category[];
        return {
          id: p.id,
          name: p.name,
          price: p.price,
          image: p.image,
          categories: catsForP,
          badge: p.badge ?? undefined,
        } as Product;
      });

      setAllProducts(mapped);
      setAllCategories(cats);
    } catch (err) {
      console.error(err);
      setAllProducts([]);
      setAllCategories([]);
    }
  }

  const todaysSpecial = allProducts.filter((p) => p.badge === "Special");
  const bestSellers = allProducts.filter((p) => p.badge === "Bestseller");

  const handleOccasionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    if (value && value !== "Select An Occasion") {
      setSelectedOccasion(value as Category);
    } else {
      setSelectedOccasion(null);
    }
  };

  const handleFindBouquet = () => {
    if (selectedOccasion) {
      onNavigate("products", selectedOccasion);
    } else {
      onNavigate("products");
    }
  };

  return (
    <div className="min-h-screen">
      {/* Product Detail Modal */}
      <ProductDetailModal product={selectedProduct} onClose={onCloseProductDetail} onAddToCart={onAddToCart} isLoggedIn={isLoggedIn} onShowLoginRequired={onShowLoginRequired} />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2
                className="text-5xl mb-4"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Celebrate Life's Moments with Style
              </h2>
              <p className="text-gray-700 mb-8">
                Unique gifts & stunning flowers for every occasion.
              </p>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  className="bg-[#FF69B4] hover:bg-[#FF1493] text-white px-8 py-6"
                  onClick={() => onNavigate("products")}
                >
                  SHOP NOW
                </Button>
              </motion.div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&h=600&fit=crop"
                  alt="Flower arrangement"
                  className="rounded-lg shadow-lg w-full"
                />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Quick Gift Finder */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="bg-[#FF69B4] py-8"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between gap-6 flex-wrap">
            <div className="flex items-center gap-3 text-white">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-[#FF69B4]">🎁</span>
              </div>
              <span>QUICK GIFT FINDER</span>
            </div>
            <div className="flex gap-4 flex-1 max-w-2xl">
              <select 
                className="flex-1 px-4 py-2 rounded border border-white/30 bg-white/10 text-white placeholder:text-white/70 [&>option]:bg-gray-800 [&>option]:text-white [&>option]:py-2"
                onChange={handleOccasionChange}
                defaultValue="Select An Occasion"
              >
                <option disabled className="bg-gray-800 text-white">Select An Occasion</option>
                {allCategories.map((category) => (
                  <option key={category.id} value={category.name} className="bg-gray-800 text-white">
                    {category.name}
                  </option>
                ))}
              </select>
              <Button 
                className="bg-gray-800 hover:bg-gray-900 text-white px-8"
                onClick={handleFindBouquet}
              >
                Find Bouquet
              </Button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Today's Special */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-between mb-8"
          >
            <h2
              className="text-3xl"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Today's Special
            </h2>
            <Button
              variant="outline"
              onClick={() => onNavigate("products")}
              className="border-[#FF69B4] text-[#FF69B4] hover:bg-[#FF69B4] hover:text-white"
            >
              View All
            </Button>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {todaysSpecial.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <ProductCard {...product} onClick={() => onProductClick(product)} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bestsellers */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-between mb-8"
          >
            <h2
              className="text-3xl"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Bestsellers
            </h2>
            <Button
              variant="outline"
              onClick={() => onNavigate("products")}
              className="border-[#FF69B4] text-[#FF69B4] hover:bg-[#FF69B4] hover:text-white"
            >
              View All
            </Button>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {bestSellers.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <ProductCard {...product} onClick={() => onProductClick(product)} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Complete Collection */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto"
          >
            <div className="text-6xl mb-4">🌺</div>
            <h2
              className="text-4xl mb-4"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Complete Collection
            </h2>
            <p className="text-gray-600 mb-8">
              Each bouquet is carefully crafted with love and attention to detail for your special moments.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  className="bg-[#FF69B4] hover:bg-[#FF1493] text-white px-8 py-6"
                  onClick={() => onNavigate("products")}
                >
                  More Products
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  className="border-[#FF69B4] text-[#FF69B4] hover:bg-[#FF69B4] hover:text-white px-8 py-6"
                  onClick={() => onNavigate("categories")}
                >
                  Browse Categories
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
