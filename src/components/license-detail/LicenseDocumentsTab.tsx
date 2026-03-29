import { useEffect, useState } from 'react';
import { Plus, FileText, Download, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

interface LicenseDocumentsTabProps {
  licenseId: string;
}

const DOCUMENT_CATEGORIES = [
  { value: 'original', label: 'Original License/Certificate' },
  { value: 'renewal', label: 'Renewal Documents' },
  { value: 'application', label: 'Application Forms' },
  { value: 'receipt', label: 'Payment Receipts' },
  { value: 'correspondence', label: 'Correspondence' },
  { value: 'inspection', label: 'Inspection Reports' },
  { value: 'compliance', label: 'Compliance Certificates' },
];

export default function LicenseDocumentsTab({ licenseId }: LicenseDocumentsTabProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchDocuments();
  }, [licenseId]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('license_documents')
        .select('*')
        .eq('license_id', licenseId)
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

  const getCategoryLabel = (category: string) => {
    const cat = DOCUMENT_CATEGORIES.find(c => c.value === category);
    return cat ? cat.label : category;
  };

  const getCategoryIcon = (category: string) => {
    return <FileText className="w-6 h-6 text-primary" />;
  };

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
            All ({documents.length})
          </button>
          {DOCUMENT_CATEGORIES.map(cat => {
            const count = documents.filter(d => d.category === cat.value).length;
            if (count === 0) return null;
            return (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  selectedCategory === cat.value
                    ? 'bg-primary text-white'
                    : 'bg-dark-brown/5 text-dark-brown hover:bg-dark-brown/10'
                }`}
              >
                {cat.label.split(' ')[0]} ({count})
              </button>
            );
          })}
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-sage text-white rounded-xl font-semibold hover:shadow-soft-lg transition-all whitespace-nowrap">
          <Plus className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      {filteredDocuments.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredDocuments.map(doc => (
            <div
              key={doc.id}
              className="bg-white border-2 border-dark-brown/5 rounded-xl p-4 hover:shadow-soft transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  {getCategoryIcon(doc.category)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-dark-brown truncate">{doc.file_name}</h4>
                      <p className="text-sm text-dark-brown/60">{getCategoryLabel(doc.category)}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button className="p-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="p-2 bg-soft-red/10 hover:bg-soft-red/20 text-soft-red rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-dark-brown/60">
                    <span>
                      Uploaded: {format(new Date(doc.uploaded_at), 'MMM dd, yyyy')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white border-2 border-dark-brown/5 rounded-xl">
          <FileText className="w-16 h-16 text-dark-brown/20 mx-auto mb-4" />
          <h3 className="font-heading text-xl font-bold text-dark-brown/60 mb-2">
            No documents uploaded
          </h3>
          <p className="text-dark-brown/40 mb-4">
            {selectedCategory === 'all'
              ? 'Upload license documents, receipts, and correspondence'
              : `No ${getCategoryLabel(selectedCategory).toLowerCase()} uploaded yet`}
          </p>
          <button className="px-6 py-3 bg-gradient-to-r from-primary to-sage text-white rounded-xl font-semibold hover:shadow-soft-lg transition-all">
            Upload First Document
          </button>
        </div>
      )}

      <div className="bg-sage/10 rounded-xl p-6">
        <h4 className="font-semibold text-dark-brown mb-3">Document Categories</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {DOCUMENT_CATEGORIES.map(cat => {
            const count = documents.filter(d => d.category === cat.value).length;
            return (
              <div key={cat.value} className="flex items-center gap-3 p-3 bg-white rounded-lg">
                <FileText className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-dark-brown">{cat.label}</p>
                  <p className="text-xs text-dark-brown/60">{count} document{count !== 1 ? 's' : ''}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
