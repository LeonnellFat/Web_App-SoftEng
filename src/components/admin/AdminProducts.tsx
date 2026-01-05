import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Plus, Edit, Trash2, X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { type Product as ProductType, type Category } from "../../data/products";
import supabase from "../../services/supabaseClient";

interface CategoryInfo {
  id: string;
  name: string;
}

type ProductRow = {
  id: string;
  name: string;
  price: number;
  image?: string;
  badge?: string | null;
};

export function AdminProducts() {
  const [products, setProducts] = useState<ProductType[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductType | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    image: "",
    categories: [] as Category[],
    badge: "",
  });

  const handleOpenModal = (product?: ProductType) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        price: product.price.toString(),
        image: product.image,
        categories: product.categories,
        badge: product.badge || "",
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        price: "",
        image: "",
        categories: [],
        badge: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  async function fetchProducts() {
    setLoading(true);
    setError(null);
    try {
      const { data: prodData, error: prodErr } = await supabase.from('products').select('*');
      if (prodErr) {
        setError(prodErr.message);
        setProducts([]);
        return;
      }

      const prods = (prodData ?? []) as ProductRow[];
      // fetch categories and product_categories
      const { data: catsData } = await supabase.from('categories').select('*');
      const cats = (catsData ?? []) as CategoryInfo[];
      const catMap: Record<string, string> = {};
      cats.forEach((c) => { catMap[c.id] = c.name; });

      const prodIds = prods.map(p => p.id);
      let pcData: any[] = [];
      if (prodIds.length) {
        const { data: pc, error: pcErr } = await supabase.from('product_categories').select('*').in('product_id', prodIds);
        if (pcErr) {
          console.warn('No product categories', pcErr);
        } else {
          pcData = pc ?? [];
        }
      }

      const mapped: ProductType[] = prods.map(p => {
        const catsForP = pcData.filter((r) => r.product_id === p.id).map(r => catMap[r.category_id]).filter(Boolean) as Category[];
        return {
          id: p.id,
          name: p.name,
          price: p.price,
          image: p.image,
          categories: catsForP,
          badge: p.badge ?? undefined,
        } as ProductType;
      });

      setProducts(mapped);
      setCategories(cats.map(c => ({ id: c.id, name: c.name })));
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    (async () => {
      setLoading(true);
      setError(null);
      try {
        if (editingProduct) {
          // Update product row
          await supabase.from('products').update({
            name: formData.name,
            price: Math.round(Number(formData.price)),
            image: formData.image,
            badge: formData.badge || null
          }).eq('id', editingProduct.id);

          // update categories mapping: delete old then insert new
          await supabase.from('product_categories').delete().eq('product_id', editingProduct.id);
          const categoryIds = categories.filter(c => formData.categories.includes(c.name as Category)).map(c => c.id);
          if (categoryIds.length) {
            const inserts = categoryIds.map(cid => ({ product_id: editingProduct.id, category_id: cid }));
            await supabase.from('product_categories').insert(inserts);
          }
        } else {
          // Insert new product
          const { data: inserted, error: insertErr } = await supabase.from('products').insert([{
            name: formData.name,
            price: Math.round(Number(formData.price)),
            image: formData.image,
            badge: formData.badge || null
          }]).select().limit(1).single();
          if (insertErr) throw insertErr;
          const newId = inserted.id as string;
          const categoryIds = categories.filter(c => formData.categories.includes(c.name as Category)).map(c => c.id);
          if (categoryIds.length) {
            const inserts = categoryIds.map(cid => ({ product_id: newId, category_id: cid }));
            await supabase.from('product_categories').insert(inserts);
          }
        }
        await fetchProducts();
      } catch (err: any) {
        console.error(err);
        setError(err?.message ?? String(err));
      } finally {
        setLoading(false);
        handleCloseModal();
      }
    })();
  };

  const handleDelete = (id: string) => {
    (async () => {
      if (!confirm("Are you sure you want to delete this product?")) return;
      setLoading(true);
      setError(null);
      try {
        await supabase.from('product_categories').delete().eq('product_id', id);
        await supabase.from('products').delete().eq('id', id);
        await fetchProducts();
      } catch (err: any) {
        console.error(err);
        setError(err?.message ?? String(err));
      } finally {
        setLoading(false);
      }
    })();
  };

  const toggleCategory = (category: Category) => {
    setFormData({
      ...formData,
      categories: formData.categories.includes(category)
        ? formData.categories.filter((c) => c !== category)
        : [...formData.categories, category],
    });
  };

  useEffect(() => { fetchProducts(); /* eslint-disable-next-line */ }, []);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
            Products
          </h1>
          <p className="text-gray-600">Manage your flower products</p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="bg-[#FF69B4] hover:bg-[#FF1493] text-white"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Product
        </Button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-lg border border-gray-200 overflow-hidden group hover:shadow-lg transition-shadow"
          >
            <div className="relative aspect-square overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {product.badge && (
                <div className="absolute top-2 left-2 bg-[#FF69B4] text-white px-3 py-1 rounded-full text-sm">
                  {product.badge}
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="mb-2">{product.name}</h3>
              <p className="text-[#FF69B4] mb-3">₱ {Number(product.price).toFixed(2)}</p>
              <div className="flex flex-wrap gap-1 mb-4">
                {product.categories.slice(0, 2).map((cat) => (
                  <span key={cat} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                    {cat}
                  </span>
                ))}
                {product.categories.length > 2 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                    +{product.categories.length - 2}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleOpenModal(product)}
                  variant="outline"
                  size="sm"
                  className="flex-1 border-[#FF69B4] text-[#FF69B4] hover:bg-[#FF69B4] hover:text-white"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  onClick={() => handleDelete(product.id)}
                  variant="outline"
                  size="sm"
                  className="flex-1 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseModal}
            className="fixed inset-0 bg-black/50 z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-lg shadow-xl z-50 max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl" style={{ fontFamily: "'Playfair Display', serif" }}>
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product-name">Product Name</Label>
                <Input
                  id="product-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Rose Bouquet"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-price">Price (₱)</Label>
                <Input
                  id="product-price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  onKeyDown={(e) => {
                    if (!/[0-9.]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
                      e.preventDefault();
                    }
                  }}
                  placeholder="e.g., 150.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-image">Image URL</Label>
                <Input
                  id="product-image"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Categories</Label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((cat) => (
                    <label
                      key={cat.name}
                      className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={formData.categories.includes(cat.name as Category)}
                        onChange={() => toggleCategory(cat.name as Category)}
                        className="w-4 h-4 text-[#FF69B4] border-gray-300 rounded focus:ring-[#FF69B4]"
                      />
                      <span className="text-sm">{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-badge">Badge (Optional)</Label>
                <select
                  id="product-badge"
                  value={formData.badge}
                  onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                >
                  <option value="">None</option>
                  <option value="Special">Special</option>
                  <option value="Bestseller">Bestseller</option>
                  <option value="New">New</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-[#FF69B4] hover:bg-[#FF1493] text-white"
                >
                  {editingProduct ? "Update Product" : "Add Product"}
                </Button>
                <Button
                  type="button"
                  onClick={handleCloseModal}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </div>
  );
}
