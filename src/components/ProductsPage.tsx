import { useState, useEffect } from "react";
import { ProductCard } from "./ProductCard";
import { ProductDetailModal } from "./ProductDetailModal";
import { motion } from "motion/react";
import { X } from "lucide-react";
import { Button } from "./ui/button";
import supabase from "../services/supabaseClient";
import type { Category, Product } from "../data/products";

interface ProductsPageProps {
  selectedCategory?: Category | null;
  onClearCategory?: () => void;
  onNavigate: (page: string, category?: Category) => void;
  onProductClick: (product: Product) => void;
  selectedProduct: Product | null;
  onCloseProductDetail: () => void;
  onAddToCart?: (product: Product) => void;
  isLoggedIn?: boolean;
  onShowLoginRequired?: () => void;
}

export function ProductsPage({ 
  selectedCategory, 
  onClearCategory, 
  onNavigate,
  onProductClick,
  selectedProduct,
  onCloseProductDetail,
  onAddToCart,
  isLoggedIn,
  onShowLoginRequired
}: ProductsPageProps) {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allCategories, setAllCategories] = useState<{ id: string; name: string }[]>([]);
  const [quickFinderOccasion, setQuickFinderOccasion] = useState<Category | null>(null);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchProducts() {
    // load products
    const { data: prodData, error: prodErr } = await supabase.from('products').select('*');
    if (prodErr) {
      console.error('Error loading products', prodErr);
      setAllProducts([]);
      return;
    }

    const prods = (prodData ?? []) as any[];

    // load categories and mappings
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
  }

  const filteredProducts = selectedCategory
    ? allProducts.filter((p) => p.categories.includes(selectedCategory))
    : allProducts;

  const handleOccasionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    if (value && value !== "Select An Occasion") {
      setQuickFinderOccasion(value as Category);
    } else {
      setQuickFinderOccasion(null);
    }
  };

  const handleFindBouquet = () => {
    if (quickFinderOccasion) {
      onNavigate("products", quickFinderOccasion);
    } else {
      onNavigate("products");
    }
  };

  return (
    <div className="min-h-screen">
      {/* Product Detail Modal */}
      <ProductDetailModal product={selectedProduct} onClose={onCloseProductDetail} onAddToCart={onAddToCart} isLoggedIn={isLoggedIn} onShowLoginRequired={onShowLoginRequired} />

      {/* Header Banner */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="bg-[#FF69B4] py-12"
      >
        <div className="max-w-7xl mx-auto px-6">
          <h2
            className="text-4xl text-white mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Same Day Flower And Gift Delivery
          </h2>
          <p className="text-white">
            Order before <span className="font-semibold">5:00pm</span> for same-day delivery across the Philippines, 7 days a week.
          </p>
        </div>
      </motion.section>

      {/* Quick Gift Finder */}
      <section className="bg-[#FF69B4] border-t border-white/20 py-6">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-6 flex-wrap">
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
      </section>

      {/* Products Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6">
          {/* Category Filter Badge */}
          {selectedCategory && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex items-center gap-2"
            >
              <span className="text-gray-600">Showing results for:</span>
              <div className="flex items-center gap-2 bg-[#FF69B4] text-white px-4 py-2 rounded-full">
                <span>{selectedCategory}</span>
                <button
                  onClick={onClearCategory}
                  className="hover:bg-white/20 rounded-full p-1 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Product Count */}
          <div className="mb-8">
            <p className="text-gray-600">{filteredProducts.length} products found</p>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <ProductCard {...product} onClick={() => onProductClick(product)} />
              </motion.div>
            ))}
          </div>

          {/* No products message */}
          {filteredProducts.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <p className="text-gray-500 text-xl mb-4">No products found in this category</p>
              <button
                onClick={onClearCategory}
                className="text-[#FF69B4] hover:underline"
              >
                View all products
              </button>
            </motion.div>
          )}

          {/* Pagination */}
          {filteredProducts.length > 0 && (
            <div className="flex items-center justify-center gap-2 mt-12">
              <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                Previous
              </button>
              <button className="px-4 py-2 bg-[#FF69B4] text-white rounded">
                1
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                2
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                3
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                Next
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
