import { useState, useEffect } from 'react';
import { Upload, File, Image, FileText, Download, Trash2, FolderOpen } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';

interface FilesTabProps {
  productId: string;
}

const categories = [
  { name: 'Formulas', icon: '⚗️' },
  { name: 'Test Reports', icon: '🧪' },
  { name: 'Packaging Designs', icon: '📦' },
  { name: 'Certificates', icon: '🏆' },
  { name: 'Marketing Materials', icon: '📢' },
  { name: 'Legal Documents', icon: '📋' },
  { name: 'Research Papers', icon: '📚' },
  { name: 'Photos', icon: '📸' },
];

export default function FilesTab({ productId }: FilesTabProps) {
  const { user } = useAuth();
  const [files, setFiles] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [formData, setFormData] = useState({
    file_name: '',
    file_url: '',
    file_type: 'application/pdf',
    category: 'Formulas',
  });

  useEffect(() => {
    fetchData();
  }, [productId]);

  const fetchData = async () => {
    try {
      const [filesRes, usersRes] = await Promise.all([
        supabase
          .from('product_files')
          .select('*')
          .eq('product_id', productId)
          .order('created_at', { ascending: false }),
        supabase
          .from('users')
          .select('*'),
      ]);

      if (filesRes.error) throw filesRes.error;
      if (usersRes.error) throw usersRes.error;

      setFiles(filesRes.data || []);
      setUsers(usersRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('product_files')
        .insert([{
          product_id: productId,
          ...formData,
          file_size: 0,
          uploaded_by: user?.id,
        }]);

      if (error) throw error;

      setFormData({
        file_name: '',
        file_url: '',
        file_type: 'application/pdf',
        category: 'Formulas',
      });
      setShowUploadModal(false);
      fetchData();
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const { error } = await supabase
        .from('product_files')
        .delete()
        .eq('id', fileId);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.name || 'Unknown';
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="w-6 h-6" />;
    } else if (fileType === 'application/pdf') {
      return <FileText className="w-6 h-6" />;
    } else {
      return <File className="w-6 h-6" />;
    }
  };

  const filteredFiles = selectedCategory
    ? files.filter(f => f.category === selectedCategory)
    : files;

  const filesByCategory = categories.reduce((acc, cat) => {
    acc[cat.name] = files.filter(f => f.category === cat.name).length;
    return acc;
  }, {} as Record<string, number>);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-2xl font-bold text-primary">Files & Documents</h3>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-accent to-secondary text-white rounded-xl font-semibold hover:shadow-soft transition-all"
        >
          <Upload className="w-5 h-5" />
          Upload File
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map(cat => (
          <button
            key={cat.name}
            onClick={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
            className={`p-4 rounded-xl border-2 transition-all ${
              selectedCategory === cat.name
                ? 'border-accent bg-accent/10'
                : 'border-dark-brown/10 hover:border-accent/50 bg-white'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{cat.icon}</span>
              <span className="font-semibold text-dark-brown text-sm">{cat.name}</span>
            </div>
            <p className="text-2xl font-bold text-accent">{filesByCategory[cat.name] || 0}</p>
          </button>
        ))}
      </div>

      {selectedCategory && (
        <div className="flex items-center gap-2 text-sm">
          <FolderOpen className="w-4 h-4 text-accent" />
          <span className="text-dark-brown">Showing files in: <strong>{selectedCategory}</strong></span>
          <button
            onClick={() => setSelectedCategory(null)}
            className="text-accent hover:underline"
          >
            Clear filter
          </button>
        </div>
      )}

      {filteredFiles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFiles.map(file => (
            <div
              key={file.id}
              className="bg-white rounded-xl p-4 border-2 border-dark-brown/5 hover:border-accent/30 transition-all"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center text-accent flex-shrink-0">
                  {getFileIcon(file.file_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-dark-brown truncate" title={file.file_name}>
                    {file.file_name}
                  </h4>
                  <p className="text-xs text-dark-brown/60">
                    {file.category}
                  </p>
                </div>
              </div>

              <div className="text-xs text-dark-brown/60 space-y-1 mb-3">
                <p>Uploaded by {getUserName(file.uploaded_by)}</p>
                <p>{format(new Date(file.created_at), 'MMM dd, yyyy')}</p>
                {file.file_size > 0 && <p>{formatFileSize(file.file_size)}</p>}
              </div>

              <div className="flex gap-2">
                <a
                  href={file.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg font-semibold transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
                <button
                  onClick={() => handleDelete(file.id)}
                  className="px-3 py-2 bg-soft-red/10 hover:bg-soft-red/20 text-soft-red rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-cream/30 rounded-xl">
          <span className="text-6xl mb-4 block">📁</span>
          <p className="text-dark-brown/60 mb-4">
            {selectedCategory
              ? `No files in ${selectedCategory} yet`
              : 'No files uploaded yet'}
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-accent to-secondary text-white font-semibold rounded-xl hover:shadow-soft transition-all"
          >
            Upload Your First File
          </button>
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 bg-primary/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-soft-lg max-w-xl w-full">
            <div className="bg-gradient-to-r from-accent to-secondary p-6 rounded-t-2xl">
              <h3 className="font-heading text-2xl font-bold text-white">Upload File</h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-dark-brown mb-2">
                  Category <span className="text-soft-red">*</span>
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                >
                  {categories.map(cat => (
                    <option key={cat.name} value={cat.name}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-brown mb-2">
                  File Name <span className="text-soft-red">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.file_name}
                  onChange={(e) => setFormData({ ...formData, file_name: e.target.value })}
                  placeholder="e.g., Formula v1.0.pdf"
                  className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-brown mb-2">
                  File URL <span className="text-soft-red">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={formData.file_url}
                  onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                  placeholder="https://example.com/file.pdf"
                  className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                />
                <p className="text-xs text-dark-brown/60 mt-2">
                  Enter the direct URL to your file
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-brown mb-2">
                  File Type
                </label>
                <select
                  value={formData.file_type}
                  onChange={(e) => setFormData({ ...formData, file_type: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                >
                  <option value="application/pdf">PDF Document</option>
                  <option value="image/jpeg">JPEG Image</option>
                  <option value="image/png">PNG Image</option>
                  <option value="application/msword">Word Document</option>
                  <option value="application/vnd.ms-excel">Excel Spreadsheet</option>
                  <option value="text/plain">Text File</option>
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-6 py-3 bg-dark-brown/5 text-dark-brown font-semibold rounded-xl hover:bg-dark-brown/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-accent to-secondary text-white font-semibold rounded-xl hover:shadow-soft-lg transition-all"
                >
                  Upload File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
