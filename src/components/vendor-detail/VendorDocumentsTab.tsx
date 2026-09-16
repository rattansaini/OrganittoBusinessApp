import { useEffect, useState } from 'react';
import { Plus, FileText, Download, Trash2, X, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import AdminOnly from '../AdminOnly';

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
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploadCategory, setUploadCategory] = useState('contracts');
  const [file, setFile] = useState<File | null>(null);

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

  const handleUpload = async () => {
    if (!file || !user) {
      toast.error('Please choose a file to upload.');
      return;
    }

    setSaving(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${vendorId}/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('vendor-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('vendor-documents').getPublicUrl(filePath);

      const { error: insertError } = await supabase.from('vendor_documents').insert({
        vendor_id: vendorId,
        file_name: file.name,
        category: uploadCategory,
        file_url: data.publicUrl,
        file_size: file.size,
        uploaded_by: user.id,
      });

      if (insertError) throw insertError;

      await fetchDocuments();
      setShowUploadModal(false);
      setFile(null);
      setUploadCategory('contracts');
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (docId: string) => {
    const confirmed = await confirm({ message: 'Delete this document? This cannot be undone.' });
    if (!confirmed) return;

    setDeletingId(docId);
    try {
      const { error } = await supabase.from('vendor_documents').delete().eq('id', docId);
      if (error) throw error;
      await fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="font-heading text-xl font-bold text-primary">Documents</h3>
        <AdminOnly>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-semibold bg-gradient-to-b from-[#3B6720] to-[#2A4B14] border border-[#1E3A0D] shadow-[inset_0_1px_0_rgba(255,255,255,.2)] shadow-e1 hover:-translate-y-[1px] transition-transform"
          >
            <Plus className="w-5 h-5" />
            Upload Document
          </button>
        </AdminOnly>
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
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg font-semibold transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                  <AdminOnly>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      disabled={deletingId === doc.id}
                      className="p-2 hover:bg-soft-red/10 text-soft-red rounded-lg transition-colors disabled:opacity-50"
                    >
                      {deletingId === doc.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </AdminOnly>
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
          <AdminOnly>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-6 py-3 rounded-xl text-white font-semibold bg-gradient-to-b from-[#3B6720] to-[#2A4B14] border border-[#1E3A0D] shadow-[inset_0_1px_0_rgba(255,255,255,.2)] shadow-e1 hover:-translate-y-[1px] transition-transform"
          >
            Upload Document
          </button>
          </AdminOnly>
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-soft-lg max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading text-xl font-bold text-primary">Upload Document</h3>
              <button
                onClick={() => { setShowUploadModal(false); setFile(null); }}
                className="p-2 hover:bg-dark-brown/5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-dark-brown" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-body font-normal text-dark-brown mb-2">Category</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-dark-brown/10 rounded-lg focus:border-primary focus:outline-none"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-body font-normal text-dark-brown mb-2">File *</label>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border-2 border-dark-brown/10 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>

              <button
                onClick={handleUpload}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold bg-gradient-to-b from-[#3B6720] to-[#2A4B14] border border-[#1E3A0D] shadow-[inset_0_1px_0_rgba(255,255,255,.2)] shadow-e1 hover:-translate-y-[1px] transition-transform disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                {saving ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
