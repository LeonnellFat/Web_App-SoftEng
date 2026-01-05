import { useState } from "react";
import { motion } from "motion/react";
import { Plus, Edit2, Trash2, Search } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import supabase from "../../services/supabaseClient";
import { toast } from "sonner";
import type { FlowerType } from "../../data/bouquetData";

interface AdminFlowerTypesProps {
  flowers: FlowerType[];
  onUpdateFlowers: (flowers: FlowerType[]) => void;
}

export function AdminFlowerTypes({ flowers, onUpdateFlowers }: AdminFlowerTypesProps) {

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFlower, setEditingFlower] = useState<FlowerType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    image: "",
    category: "",
    available: true
  });

  const filteredFlowers = flowers.filter((flower) =>
    flower.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveFlower = () => {
    if (formData.name && formData.image) {
      (async () => {
        try {
          if (editingFlower) {
            const { error } = await supabase
              .from('flower_types')
              .update({ name: formData.name, image: formData.image, category: formData.category, available: formData.available })
              .eq('id', editingFlower.id);
            if (error) throw error;

            onUpdateFlowers(flowers.map(flower => flower.id === editingFlower.id ? { ...flower, ...formData } : flower));
            setEditingFlower(null);
            toast.success('Flower updated');
          } else {
            const { data, error } = await supabase
              .from('flower_types')
              .insert({ name: formData.name, image: formData.image, category: formData.category, available: formData.available })
              .select()
              .single();
            if (error) throw error;

            const newFlower: FlowerType = { id: data.id, name: data.name, image: data.image, category: data.category ?? '', available: data.available ?? true };
            onUpdateFlowers([...flowers, newFlower]);
            toast.success('Flower added');
          }
        } catch (err: any) {
          console.error('Failed to save flower', err);
          toast.error(err?.message || 'Failed to save flower');
        } finally {
          setFormData({ name: '', image: '', category: '', available: true });
          setShowAddForm(false);
        }
      })();
    }
  };

  const handleEditFlower = (flower: FlowerType) => {
    setEditingFlower(flower);
    setFormData({
      name: flower.name,
      image: flower.image,
      category: (flower as any).category ?? "",
      available: flower.available
    });
    setShowAddForm(true);
  };

  const handleDeleteFlower = (id: string) => {
    (async () => {
      try {
        const { error } = await supabase.from('flower_types').delete().eq('id', id);
        if (error) throw error;
        onUpdateFlowers(flowers.filter(flower => flower.id !== id));
        toast.success('Flower deleted');
      } catch (err: any) {
        console.error('Failed to delete flower', err);
        toast.error(err?.message || 'Failed to delete flower');
      }
    })();
  };

  const handleToggleAvailability = (id: string) => {
    (async () => {
      try {
        const f = flowers.find((x) => x.id === id);
        if (!f) return;
        const newAvailable = !f.available;
        const { error } = await supabase.from('flower_types').update({ available: newAvailable }).eq('id', id);
        if (error) throw error;
        onUpdateFlowers(flowers.map(flower => flower.id === id ? { ...flower, available: newAvailable } : flower));
        toast.success('Availability updated');
      } catch (err: any) {
        console.error('Failed to toggle availability', err);
        toast.error(err?.message || 'Failed to toggle availability');
      }
    })();
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
            Flower Types
          </h1>
          <p className="text-gray-600">Manage available flowers for custom bouquets</p>
        </div>
        <Button
          onClick={() => {
            setShowAddForm(true);
            setEditingFlower(null);
        setFormData({ name: "", image: "", category: "", available: true });
          }}
          className="bg-[#FF69B4] hover:bg-[#FF1493] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Flower
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search flowers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white border border-gray-200 rounded-lg p-6 mb-6"
        >
          <h3 className="text-xl mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            {editingFlower ? "Edit Flower" : "Add New Flower"}
          </h3>
          
          <div className="grid gap-4">
            <div>
              <Label htmlFor="flowerName">Flower Name</Label>
              <Input
                id="flowerName"
                type="text"
                placeholder="e.g., Red Roses"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                type="text"
                placeholder="https://..."
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              />
            </div>

            <div>
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.available}
                  onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                  className="w-4 h-4"
                />
                Available for custom bouquets
              </Label>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <Button
              onClick={handleSaveFlower}
              className="bg-[#FF69B4] hover:bg-[#FF1493] text-white"
            >
              {editingFlower ? "Update Flower" : "Save Flower"}
            </Button>
            <Button
              onClick={() => {
                setShowAddForm(false);
                setEditingFlower(null);
                setFormData({ name: "", image: "", category: "", available: true });
              }}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </motion.div>
      )}

      {/* Flowers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredFlowers.map((flower, index) => (
          <motion.div
            key={flower.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="relative aspect-square">
              <ImageWithFallback
                src={flower.image}
                alt={flower.name}
                className="w-full h-full object-cover"
              />
              {!flower.available && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm">
                    Unavailable
                  </span>
                </div>
              )}
            </div>
            
            <div className="p-4">
              <h3 className="mb-3">{flower.name}</h3>
              
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => handleToggleAvailability(flower.id)}
                  className={`flex-1 px-3 py-2 rounded-md text-sm transition-colors ${
                    flower.available
                      ? "bg-green-50 text-green-700 hover:bg-green-100"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {flower.available ? "Available" : "Unavailable"}
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEditFlower(flower)}
                  className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteFlower(flower.id)}
                  className="flex-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-md text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredFlowers.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No flowers found
        </div>
      )}
    </div>
  );
}
