import { ImageWithFallback } from "./figma/ImageWithFallback";
import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import supabase from "../services/supabaseClient";

interface Category {
  id: string;
  name: string;
  description?: string | null;
  image?: string | null;
}

interface CategoriesPageProps {
  onNavigate: (page: string, category?: string | Category) => void;
}

export function CategoriesPage({ onNavigate }: CategoriesPageProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCategoryClick = (categoryName: string) => {
    onNavigate("products", categoryName);
  };

  useEffect(() => { fetchCategories(); /* eslint-disable-next-line */ }, []);

  async function fetchCategories() {
    setLoading(true);
    setError(null);
    try {
      const { data: catsData, error: catsErr } = await supabase.from('categories').select('*').order('name');
      if (catsErr) throw catsErr;
      const cats = (catsData ?? []) as Category[];

      // fetch product->category mappings
      const catIds = cats.map(c => c.id);
      let pc: any[] = [];
      if (catIds.length) {
        const { data: pcData, error: pcErr } = await supabase.from('product_categories').select('category_id,product_id').in('category_id', catIds);
        if (pcErr) {
          console.warn('Failed to load product_categories', pcErr.message || pcErr);
        } else {
          pc = pcData ?? [];
        }
      }

      const countsMap: Record<string, number> = {};
      pc.forEach((r) => { countsMap[r.category_id] = (countsMap[r.category_id] || 0) + 1; });

      setCategories(cats);
      setCounts(countsMap);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? String(err));
      setCategories([]);
      setCounts({});
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-br from-pink-50 to-purple-50 py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Shop by Categories
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-700 max-w-2xl mx-auto"
          >
            Browse our carefully curated collection of flowers for every occasion.
            Find the perfect arrangement to express your feelings.
          </motion.p>
        </div>
      </section>



      {/* By Occasions Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          {/* By Occasions Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h3
              className="text-3xl mb-2"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              By Categories
            </h3>
            <div className="w-24 h-1 bg-[#FF69B4] mx-auto rounded-full"></div>
          </motion.div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <motion.button
                key={category.id}
                onClick={() => handleCategoryClick(category.name)}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all"
              >
                <div className="relative aspect-square overflow-hidden">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.4 }}
                  >
                    <ImageWithFallback
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 className="text-xl mb-2">{category.name}</h3>
                    {category.description && (
                      <p className="text-xs text-white/80 mb-2 line-clamp-2">
                        {category.description}
                      </p>
                    )}
                    <p className="text-sm text-white/90">
                      {counts[category.id] || 0} items
                    </p>
                  </div>
                  {/* Decorative corner accent */}
                  <motion.div
                    className="absolute top-4 right-4 w-12 h-12 border-2 border-white/50 rounded-full flex items-center justify-center backdrop-blur-sm bg-white/10"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <span className="text-white text-xl">→</span>
                  </motion.div>
                </div>
                <div className="p-4">
                  <p className="text-gray-600 text-sm group-hover:text-[#FF69B4] transition-colors">
                    {category.description}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}