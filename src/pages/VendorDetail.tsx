import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Star, BarChart3, CreditCard, Receipt, List, FileText, MessageSquare } from 'lucide-react';
import Header from '../components/Header';
import VendorOverviewTab from '../components/vendor-detail/VendorOverviewTab';
import VendorTransactionsTab from '../components/vendor-detail/VendorTransactionsTab';
import VendorInvoicesTab from '../components/vendor-detail/VendorInvoicesTab';
import VendorPricesTab from '../components/vendor-detail/VendorPricesTab';
import VendorDocumentsTab from '../components/vendor-detail/VendorDocumentsTab';
import VendorNotesTab from '../components/vendor-detail/VendorNotesTab';
import { supabase } from '../lib/supabase';

const tabs = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'transactions', label: 'Transactions', icon: CreditCard },
  { id: 'invoices', label: 'Invoices', icon: Receipt },
  { id: 'prices', label: 'Price List', icon: List },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'notes', label: 'Notes & Reviews', icon: MessageSquare },
];

const getCategoryColor = (category: string) => {
  const colors: any = {
    'Raw Materials': 'bg-sage/20',
    'Packaging': 'bg-secondary/20',
    'Printing': 'bg-blue-500/20',
    'Logistics': 'bg-accent/20',
    'Lab Testing': 'bg-purple-500/20',
    'Other': 'bg-dark-brown/20',
  };
  return colors[category] || 'bg-dark-brown/10';
};

export default function VendorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchVendor();
    }
  }, [id]);

  const fetchVendor = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      setVendor(data);
    } catch (error) {
      console.error('Error fetching vendor:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this vendor? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', id);

      if (error) throw error;
      navigate('/vendors');
    } catch (error) {
      console.error('Error deleting vendor:', error);
      alert('Error deleting vendor');
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating ? 'fill-amber-400 text-amber-400' : 'text-dark-brown/20'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-dark-brown/60">Loading vendor details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-xl text-dark-brown/60">Vendor not found</p>
            <button
              onClick={() => navigate('/vendors')}
              className="mt-4 px-6 py-3 bg-primary text-white rounded-xl font-semibold"
            >
              Back to Vendors
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/vendors')}
          className="flex items-center gap-2 text-dark-brown hover:text-primary mb-6 font-semibold transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Vendors
        </button>

        <div className="bg-white rounded-2xl shadow-soft p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-start gap-4 mb-3">
                <div>
                  <h1 className="font-heading text-3xl font-bold text-primary mb-2">
                    {vendor.name}
                  </h1>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 ${getCategoryColor(vendor.category)} rounded-full text-sm font-semibold`}>
                    {vendor.category}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {renderStars(vendor.current_rating || 3)}
                <span className="text-sm font-semibold text-dark-brown/60">
                  {vendor.current_rating?.toFixed(1) || '3.0'} / 5.0
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {}}
                className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl font-semibold hover:bg-primary/20 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 bg-soft-red/10 text-soft-red rounded-xl font-semibold hover:bg-soft-red/20 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
          <div className="border-b-2 border-dark-brown/5 overflow-x-auto">
            <div className="flex">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'text-primary border-b-4 border-primary bg-primary/5'
                        : 'text-dark-brown/60 hover:text-primary hover:bg-primary/5'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && <VendorOverviewTab vendor={vendor} onUpdate={fetchVendor} />}
            {activeTab === 'transactions' && <VendorTransactionsTab vendorId={vendor.id} />}
            {activeTab === 'invoices' && <VendorInvoicesTab vendorId={vendor.id} />}
            {activeTab === 'prices' && <VendorPricesTab vendorId={vendor.id} />}
            {activeTab === 'documents' && <VendorDocumentsTab vendorId={vendor.id} />}
            {activeTab === 'notes' && <VendorNotesTab vendorId={vendor.id} vendorRating={vendor.current_rating} />}
          </div>
        </div>
      </div>
    </div>
  );
}
