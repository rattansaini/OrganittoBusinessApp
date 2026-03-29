import { useEffect, useState } from 'react';
import { Plus, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface BatchPhotosTabProps {
  batchId: string;
}

const categories = [
  { id: 'product', label: 'Product Photos', icon: '📦' },
  { id: 'packaging', label: 'Packaging Photos', icon: '📦' },
  { id: 'label', label: 'Label Photos', icon: '🏷️' },
  { id: 'qc', label: 'QC Photos', icon: '✅' },
  { id: 'process', label: 'Process Photos', icon: '⚙️' },
];

export default function BatchPhotosTab({ batchId }: BatchPhotosTabProps) {
  const [photos, setPhotos] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchPhotos();
  }, [batchId]);

  const fetchPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('batch_photos')
        .select('*')
        .eq('batch_id', batchId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error('Error fetching photos:', error);
    }
  };

  const filteredPhotos = selectedCategory === 'all'
    ? photos
    : photos.filter(photo => photo.category === selectedCategory);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-primary text-white'
                : 'bg-dark-brown/5 text-dark-brown hover:bg-dark-brown/10'
            }`}
          >
            All Photos ({photos.length})
          </button>
          {categories.map(cat => {
            const count = photos.filter(p => p.category === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-white'
                    : 'bg-dark-brown/5 text-dark-brown hover:bg-dark-brown/10'
                }`}
              >
                <span>{cat.icon}</span>
                {cat.label} ({count})
              </button>
            );
          })}
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-sage text-white rounded-xl font-semibold hover:shadow-soft-lg transition-all">
          <Plus className="w-4 h-4" />
          Upload Photos
        </button>
      </div>

      {filteredPhotos.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredPhotos.map(photo => {
            const category = categories.find(c => c.id === photo.category);
            return (
              <div
                key={photo.id}
                className="bg-white rounded-xl border-2 border-dark-brown/5 overflow-hidden hover:shadow-soft transition-all group"
              >
                <div className="aspect-square bg-cream relative">
                  <img
                    src={photo.photo_url}
                    alt={category?.label || 'Batch photo'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute top-2 right-2 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-semibold">
                    {category?.icon} {category?.label}
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-xs text-dark-brown/60">
                    {new Date(photo.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white border-2 border-dark-brown/5 rounded-xl">
          <ImageIcon className="w-16 h-16 text-dark-brown/20 mx-auto mb-4" />
          <h3 className="font-heading text-xl font-bold text-dark-brown/60 mb-2">
            No photos uploaded
          </h3>
          <p className="text-dark-brown/40 mb-4">
            {selectedCategory === 'all'
              ? 'Upload photos to document this batch'
              : `No ${categories.find(c => c.id === selectedCategory)?.label.toLowerCase()} uploaded yet`}
          </p>
          <button className="px-6 py-3 bg-gradient-to-r from-primary to-sage text-white rounded-xl font-semibold hover:shadow-soft-lg transition-all">
            Upload First Photo
          </button>
        </div>
      )}
    </div>
  );
}
