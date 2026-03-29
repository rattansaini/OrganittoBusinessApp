import { useEffect, useState } from 'react';
import { Plus, FileText, Download, Trash2, File } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface VendorDocumentsTabProps {
  vendorId: string;
}

const categories = [
  { id: 'contracts', label: 'Contracts & Agreements', icon: '📄' },
  { id: 'gst', label: 'GST Certificate', icon: '📜' },
  { id: 'certifications', label: 'Quality Certifications', icon: '🏆' },
  { id: 'catalogs', label: 'Product Catalogs', icon: '📋' },
  { id: 'reports', label: 'Test Reports', icon: '📊' },
  { id: 'other', label: 'Other Documents', icon: '💼' },
];

export default function VendorDocumentsTab({ vendorId }: VendorDocumentsTabProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchDocuments();
  }, [vendorId]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_documents')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const filteredDocuments = selectedCategory === 'all'
    ? documents
    : documents.filter(doc => doc.category === selectedCategory);

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId) || { icon: '📄', label: categoryId };
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="font-heading text-xl font-bold text-primary">Documents</h3>
        <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-sage text-white rounded-xl font-semibold hover:shadow-soft-lg transition-all">
          <Plus className="w-5 h-5" />
          Upload Document
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
            selectedCategory === 'all'
              ? 'bg-primary text-white'
              : 'bg-dark-brown/5 text-dark-brown hover:bg-dark-brown/10'
          }`}
        >
          All Documents ({documents.length})
        </button>
        {categories.map(cat => {
          const count = documents.filter(doc => doc.category === cat.id).length;
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

      {filteredDocuments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map(doc => {
            const catInfo = getCategoryInfo(doc.category);
            return (
              <div
                key={doc.id}
                className="bg-white border-2 border-dark-brown/5 rounded-xl p-4 hover:shadow-soft transition-all"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                    {catInfo.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-dark-brown truncate">{doc.file_name}</h4>
                    <p className="text-xs text-dark-brown/60">{catInfo.label}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-dark-brown/60 mb-3">
                  <span>{formatFileSize(doc.file_size || 0)}</span>
                  <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg font-semibold transition-colors">
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button className="p-2 hover:bg-soft-red/10 text-soft-red rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white border-2 border-dark-brown/5 rounded-xl">
          <FileText className="w-16 h-16 text-dark-brown/20 mx-auto mb-4" />
          <h3 className="font-heading text-xl font-bold text-dark-brown/60 mb-2">
            No documents found
          </h3>
          <p className="text-dark-brown/40 mb-4">
            {selectedCategory === 'all'
              ? 'Upload documents to keep vendor information organized'
              : `No ${getCategoryInfo(selectedCategory).label.toLowerCase()} uploaded yet`}
          </p>
          <button className="px-6 py-3 bg-gradient-to-r from-primary to-sage text-white rounded-xl font-semibold hover:shadow-soft-lg transition-all">
            Upload Document
          </button>
        </div>
      )}
    </div>
  );
}
