import { useEffect, useState } from 'react';
import { Plus, FileText, Award, Beaker, File, AlertTriangle, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { differenceInDays, format } from 'date-fns';

interface IngredientDocumentsTabProps {
  ingredientId: string;
}

const documentCategories = [
  { id: 'coa', label: 'Quality Certificates (COA)', icon: Award },
  { id: 'organic_cert', label: 'Organic Certifications', icon: Award },
  { id: 'test_report', label: 'Test Reports', icon: Beaker },
  { id: 'msds', label: 'MSDS (Safety Data Sheets)', icon: AlertTriangle },
  { id: 'specification', label: 'Vendor Specifications', icon: FileText },
  { id: 'photo', label: 'Ingredient Photos', icon: File },
];

export default function IngredientDocumentsTab({ ingredientId }: IngredientDocumentsTabProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchDocuments();
  }, [ingredientId]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('ingredient_documents')
        .select('*')
        .eq('ingredient_id', ingredientId)
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

  const getCategoryIcon = (category: string) => {
    const cat = documentCategories.find(c => c.id === category);
    return cat ? cat.icon : FileText;
  };

  const isExpiringSoon = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    const daysUntilExpiry = differenceInDays(new Date(expiryDate), new Date());
    return daysUntilExpiry <= 30;
  };

  const isExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    return differenceInDays(new Date(expiryDate), new Date()) < 0;
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
            All Documents ({documents.length})
          </button>
          {documentCategories.map(cat => {
            const count = documents.filter(d => d.category === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  selectedCategory === cat.id
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
          {filteredDocuments.map(doc => {
            const CategoryIcon = getCategoryIcon(doc.category);
            const categoryInfo = documentCategories.find(c => c.id === doc.category);

            return (
              <div
                key={doc.id}
                className={`bg-white border-2 rounded-xl p-4 hover:shadow-soft transition-all ${
                  isExpired(doc.expiry_date)
                    ? 'border-soft-red/20 bg-soft-red/5'
                    : isExpiringSoon(doc.expiry_date)
                    ? 'border-accent/20 bg-accent/5'
                    : 'border-dark-brown/5'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CategoryIcon className="w-6 h-6 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-dark-brown truncate">{doc.file_name}</h4>
                        <p className="text-sm text-dark-brown/60">{categoryInfo?.label}</p>
                      </div>

                      <button className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg font-semibold transition-colors text-sm">
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-dark-brown/60">
                      <span>
                        Uploaded: {format(new Date(doc.uploaded_at), 'MMM dd, yyyy')}
                      </span>
                      {doc.expiry_date && (
                        <span className={`font-semibold ${
                          isExpired(doc.expiry_date)
                            ? 'text-soft-red'
                            : isExpiringSoon(doc.expiry_date)
                            ? 'text-accent'
                            : 'text-dark-brown'
                        }`}>
                          {isExpired(doc.expiry_date) ? (
                            <>Expired: {format(new Date(doc.expiry_date), 'MMM dd, yyyy')}</>
                          ) : (
                            <>Expires: {format(new Date(doc.expiry_date), 'MMM dd, yyyy')}</>
                          )}
                        </span>
                      )}
                    </div>

                    {(isExpired(doc.expiry_date) || isExpiringSoon(doc.expiry_date)) && (
                      <div className={`mt-2 flex items-center gap-2 text-sm font-semibold ${
                        isExpired(doc.expiry_date) ? 'text-soft-red' : 'text-accent'
                      }`}>
                        <AlertTriangle className="w-4 h-4" />
                        {isExpired(doc.expiry_date) ? (
                          <span>Certificate expired - renewal required</span>
                        ) : (
                          <span>
                            Expiring in {differenceInDays(new Date(doc.expiry_date!), new Date())} days
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white border-2 border-dark-brown/5 rounded-xl">
          <FileText className="w-16 h-16 text-dark-brown/20 mx-auto mb-4" />
          <h3 className="font-heading text-xl font-bold text-dark-brown/60 mb-2">
            No documents uploaded
          </h3>
          <p className="text-dark-brown/40 mb-4">
            {selectedCategory === 'all'
              ? 'Upload quality certificates, test reports, and other documents'
              : `No ${documentCategories.find(c => c.id === selectedCategory)?.label.toLowerCase()} uploaded yet`}
          </p>
          <button className="px-6 py-3 bg-gradient-to-r from-primary to-sage text-white rounded-xl font-semibold hover:shadow-soft-lg transition-all">
            Upload First Document
          </button>
        </div>
      )}

      {documents.some(doc => isExpired(doc.expiry_date) || isExpiringSoon(doc.expiry_date)) && (
        <div className="bg-accent/10 border-2 border-accent/20 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-dark-brown mb-2">Certificate Expiry Alerts</h4>
              <p className="text-sm text-dark-brown/70 mb-3">
                Some certificates are expired or expiring soon. Ensure you have updated certifications.
              </p>
              <ul className="space-y-1 text-sm text-dark-brown/70">
                {documents
                  .filter(doc => isExpired(doc.expiry_date) || isExpiringSoon(doc.expiry_date))
                  .map(doc => (
                    <li key={doc.id}>
                      • {doc.file_name} - {isExpired(doc.expiry_date) ? 'Expired' : 'Expiring soon'}
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="bg-sage/10 rounded-xl p-6">
        <h4 className="font-semibold text-dark-brown mb-3">Document Categories</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {documentCategories.map(cat => {
            const Icon = cat.icon;
            const count = documents.filter(d => d.category === cat.id).length;
            return (
              <div key={cat.id} className="flex items-center gap-3 p-3 bg-white rounded-lg">
                <Icon className="w-5 h-5 text-primary" />
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
