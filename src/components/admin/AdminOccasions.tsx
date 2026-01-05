import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Plus, Edit, Trash2, X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import supabase from "../../services/supabaseClient";

interface CategoryInfo {
  id: string;
  name: string;
  description?: string | null;
  image?: string | null;
}

export function AdminOccasions() {
  const [occasions, setOccasions] = useState<CategoryInfo[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOccasion, setEditingOccasion] = useState<CategoryInfo | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: "",
  });

  useEffect(() => { fetchCategories(); /* eslint-disable-next-line */ }, []);

  async function fetchCategories() {
    setLoading(true);
    setError(null);
    try {
      const { data: catsData, error: catsErr } = await supabase.from('categories').select('*').order('name');
      if (catsErr) throw catsErr;
      const cats = (catsData ?? []) as CategoryInfo[];

      // fetch product -> category mappings to calculate counts
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

      setOccasions(cats);
      setCounts(countsMap);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? String(err));
      setOccasions([]);
      setCounts({});
    } finally {
      setLoading(false);
    }
  }

  const handleOpenModal = (occasion?: CategoryInfo) => {
    if (occasion) {
      setEditingOccasion(occasion);
      setFormData({
        name: occasion.name,
        description: occasion.description || "",
        image: occasion.image || "",
      });
    } else {
      setEditingOccasion(null);
      setFormData({
        name: "",
        description: "",
        image: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingOccasion(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    (async () => {
      setLoading(true);
      setError(null);
      try {
        if (editingOccasion) {
          // update
          const { error: upErr } = await supabase.from('categories').update({
            name: formData.name,
            description: formData.description,
            image: formData.image || null,
          }).eq('id', editingOccasion.id);
          if (upErr) throw upErr;
        } else {
          // insert
          const { data: ins, error: insErr } = await supabase.from('categories').insert([{ name: formData.name, description: formData.description, image: formData.image || null }]).select().limit(1).single();
          if (insErr) throw insErr;
        }
        await fetchCategories();
        handleCloseModal();
      } catch (err: any) {
        console.error(err);
        setError(err?.message ?? String(err));
      } finally {
        setLoading(false);
      }
    })();
  };

  const handleDelete = (id: string, name?: string) => {
    (async () => {
      if (!confirm(`Are you sure you want to delete ${name ?? 'this category'}?`)) return;
      setLoading(true);
      setError(null);
      try {
        // remove product mappings first
        await supabase.from('product_categories').delete().eq('category_id', id);
        // delete category
        await supabase.from('categories').delete().eq('id', id);
        await fetchCategories();
      } catch (err: any) {
        console.error(err);
        setError(err?.message ?? String(err));
      } finally {
        setLoading(false);
      }
    })();
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
            Categories
          </h1>
          <p className="text-gray-600">Manage product categories</p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="bg-[#FF69B4] hover:bg-[#FF1493] text-white"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Category
        </Button>
      </div>

  {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {occasions.map((occasion, index) => {
          const productCount = counts[occasion.id] || 0;

          return (
            <motion.div
              key={occasion.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden group hover:shadow-lg transition-shadow"
            >
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={occasion.image || undefined}
                  alt={occasion.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 right-2 bg-[#FF69B4] text-white px-3 py-1 rounded-full text-sm">
                  {productCount} {productCount === 1 ? "product" : "products"}
                </div>
              </div>
              <div className="p-4">
                <h3 className="mb-2">{occasion.name}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{occasion.description}</p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleOpenModal(occasion)}
                    variant="outline"
                    size="sm"
                    className="flex-1 border-[#FF69B4] text-[#FF69B4] hover:bg-[#FF69B4] hover:text-white"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleDelete(occasion.id, occasion.name)}
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
          );
        })}
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
                {editingOccasion ? "Edit Category" : "Add New Category"}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="occasion-name">Category Name</Label>
                <Input
                  id="occasion-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Birthday Flowers"
                  required
                  disabled={!!editingOccasion}
                />
                {editingOccasion && (
                    <p className="text-sm text-gray-500">
                    Category name cannot be changed when editing
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="occasion-description">Description</Label>
                <Textarea
                  id="occasion-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this occasion"
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="occasion-image">Image URL</Label>
                <Input
                  id="occasion-image"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://..."
                  required
                />
                {formData.image && (
                  <div className="mt-2 relative aspect-video rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-[#FF69B4] hover:bg-[#FF1493] text-white"
                >
                  {editingOccasion ? "Update Category" : "Add Category"}
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
