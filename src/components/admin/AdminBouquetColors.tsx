import { useState } from "react";
import { motion } from "motion/react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import supabase from "../../services/supabaseClient";
import { toast } from "sonner";
import type { BouquetColor } from "../../data/bouquetData";

interface AdminBouquetColorsProps {
  colors: BouquetColor[];
  onUpdateColors: (colors: BouquetColor[]) => void;
}

export function AdminBouquetColors({ colors, onUpdateColors }: AdminBouquetColorsProps) {

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingColor, setEditingColor] = useState<BouquetColor | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    hexCode: "",
    description: ""
  });

  const handleSaveColor = () => {
    if (formData.name && formData.hexCode && formData.description) {
      (async () => {
        try {
          if (editingColor) {
            // update in DB
            const { error } = await supabase
              .from('bouquet_colors')
              .update({ name: formData.name, hex_code: formData.hexCode, description: formData.description })
              .eq('id', editingColor.id);
            if (error) throw error;

            onUpdateColors(colors.map(color => color.id === editingColor.id ? { ...color, ...formData } : color));
            setEditingColor(null);
            toast.success('Color updated');
          } else {
            // insert and use returned id from DB
            const { data, error } = await supabase
              .from('bouquet_colors')
              .insert({ name: formData.name, hex_code: formData.hexCode, description: formData.description })
              .select()
              .single();
            if (error) throw error;

            const newColor: BouquetColor = { id: data.id, name: data.name, hexCode: data.hex_code, description: data.description };
            onUpdateColors([...colors, newColor]);
            toast.success('Color added');
          }
        } catch (err: any) {
          console.error('Failed to save color', err);
          toast.error(err?.message || 'Failed to save color');
        } finally {
          setFormData({ name: '', hexCode: '', description: '' });
          setShowAddForm(false);
        }
      })();
    }
  };

  const handleEditColor = (color: BouquetColor) => {
    setEditingColor(color);
    setFormData({
      name: color.name,
      hexCode: color.hexCode,
      description: color.description
    });
    setShowAddForm(true);
  };

  const handleDeleteColor = (id: string) => {
    (async () => {
      try {
        const { error } = await supabase.from('bouquet_colors').delete().eq('id', id);
        if (error) throw error;
        onUpdateColors(colors.filter(color => color.id !== id));
        toast.success('Color deleted');
      } catch (err: any) {
        console.error('Failed to delete color', err);
        toast.error(err?.message || 'Failed to delete color');
      }
    })();
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
            Bouquet Colors
          </h1>
          <p className="text-gray-600">Manage color themes for custom bouquets</p>
        </div>
        <Button
          onClick={() => {
            setShowAddForm(true);
            setEditingColor(null);
            setFormData({ name: "", hexCode: "", description: "" });
          }}
          className="bg-[#FF69B4] hover:bg-[#FF1493] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Color
        </Button>
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
            {editingColor ? "Edit Color" : "Add New Color"}
          </h3>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="colorName">Color Name</Label>
              <Input
                id="colorName"
                type="text"
                placeholder="e.g., Red"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="hexCode">Hex Code</Label>
              <div className="flex gap-2">
                <Input
                  id="hexCode"
                  type="text"
                  placeholder="#DC2626"
                  value={formData.hexCode}
                  onChange={(e) => setFormData({ ...formData, hexCode: e.target.value })}
                  className="flex-1"
                />
                <div 
                  className="w-12 h-10 rounded border-2 border-gray-300"
                  style={{ backgroundColor: formData.hexCode || "#FFFFFF" }}
                ></div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                type="text"
                placeholder="e.g., Classic passionate red"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <Button
              onClick={handleSaveColor}
              className="bg-[#FF69B4] hover:bg-[#FF1493] text-white"
            >
              {editingColor ? "Update Color" : "Save Color"}
            </Button>
            <Button
              onClick={() => {
                setShowAddForm(false);
                setEditingColor(null);
                setFormData({ name: "", hexCode: "", description: "" });
              }}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </motion.div>
      )}

      {/* Colors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {colors.map((color, index) => (
          <motion.div
            key={color.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div 
              className="h-32 flex items-center justify-center"
              style={{ backgroundColor: color.hexCode }}
            >
              <div className="text-center">
                <div 
                  className="text-2xl mb-2"
                  style={{ 
                    color: color.hexCode === "#FFFFFF" ? "#000000" : "#FFFFFF",
                    textShadow: color.hexCode === "#FFFFFF" ? "none" : "0 2px 4px rgba(0,0,0,0.2)"
                  }}
                >
                  {color.name}
                </div>
                <div 
                  className="text-sm"
                  style={{ 
                    color: color.hexCode === "#FFFFFF" ? "#666666" : "rgba(255,255,255,0.9)"
                  }}
                >
                  {color.hexCode}
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-4">{color.description}</p>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditColor(color)}
                  className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteColor(color.id)}
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
    </div>
  );
}
