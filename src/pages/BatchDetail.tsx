import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, QrCode, Printer, AlertOctagon, BarChart3, TestTube, Package, FileImage, Activity } from 'lucide-react';
import Header from '../components/Header';
import BatchOverviewTab from '../components/batch-detail/BatchOverviewTab';
import BatchQualityTab from '../components/batch-detail/BatchQualityTab';
import BatchInventoryTab from '../components/batch-detail/BatchInventoryTab';
import BatchPhotosTab from '../components/batch-detail/BatchPhotosTab';
import BatchTraceabilityTab from '../components/batch-detail/BatchTraceabilityTab';
import { supabase } from '../lib/supabase';
import { differenceInDays, format } from 'date-fns';

const tabs = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'quality', label: 'Quality & Testing', icon: TestTube },
  { id: 'inventory', label: 'Inventory & Distribution', icon: Package },
  { id: 'photos', label: 'Photos & Documents', icon: FileImage },
  { id: 'traceability', label: 'Traceability Log', icon: Activity },
];

export default function BatchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [batch, setBatch] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchBatch();
    }
  }, [id]);

  const fetchBatch = async () => {
    try {
      const { data, error } = await supabase
        .from('batches')
        .select('*, products(name, images)')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      setBatch(data);
    } catch (error) {
      console.error('Error fetching batch:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this batch? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('batches')
        .delete()
        .eq('id', id);

      if (error) throw error;
      navigate('/batches');
    } catch (error) {
      console.error('Error deleting batch:', error);
      alert('Error deleting batch');
    }
  };

  const getStatusBadge = () => {
    if (!batch) return null;

    const daysUntilExpiry = differenceInDays(new Date(batch.expiry_date), new Date());

    if (batch.status === 'recalled') {
      return { label: 'Recalled', color: 'bg-soft-red text-white', icon: '🛑' };
    }
    if (daysUntilExpiry < 0) {
      return { label: 'Expired', color: 'bg-soft-red/10 text-soft-red', icon: '🔴' };
    }
    if (batch.units_in_stock === 0) {
      return { label: 'Sold Out', color: 'bg-dark-brown/10 text-dark-brown', icon: '⚫' };
    }
    if (daysUntilExpiry <= 30) {
      return { label: 'Expiring Soon', color: 'bg-accent/10 text-accent', icon: '🟠' };
    }
    if (batch.units_in_stock < batch.batch_size * 0.2) {
      return { label: 'Low Stock', color: 'bg-amber-500/10 text-amber-500', icon: '🟡' };
    }
    if (batch.units_in_stock > 0) {
      return { label: 'In Stock', color: 'bg-blue-500/10 text-blue-500', icon: '🔵' };
    }
    return { label: 'Active', color: 'bg-sage/10 text-sage', icon: '🟢' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-dark-brown/60">Loading batch details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-xl text-dark-brown/60">Batch not found</p>
            <button
              onClick={() => navigate('/batches')}
              className="mt-4 px-6 py-3 bg-primary text-white rounded-xl font-semibold"
            >
              Back to Batches
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusBadge = getStatusBadge();

  return (
    <div className="min-h-screen bg-cream">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/batches')}
          className="flex items-center gap-2 text-dark-brown hover:text-primary mb-6 font-semibold transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Batches
        </button>

        <div className="bg-white rounded-2xl shadow-soft p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-start gap-4 mb-3">
                {batch.products?.images && batch.products.images[0] && (
                  <img
                    src={batch.products.images[0]}
                    alt={batch.products.name}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                )}
                <div>
                  <h1 className="font-mono text-3xl font-bold text-primary mb-2">
                    {batch.batch_number}
                  </h1>
                  <p className="text-lg font-semibold text-dark-brown">
                    {batch.products?.name || 'Unknown Product'}
                  </p>
                  {statusBadge && (
                    <span className={`inline-flex items-center gap-1 px-3 py-1 mt-2 ${statusBadge.color} rounded-full text-sm font-semibold`}>
                      <span>{statusBadge.icon}</span>
                      {statusBadge.label}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl font-semibold hover:bg-primary/20 transition-colors">
                <QrCode className="w-4 h-4" />
                QR Code
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl font-semibold hover:bg-primary/20 transition-colors">
                <Printer className="w-4 h-4" />
                Print Labels
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl font-semibold hover:bg-primary/20 transition-colors">
                <Edit className="w-4 h-4" />
                Edit
              </button>
              {batch.status !== 'recalled' && (
                <button className="flex items-center gap-2 px-4 py-2 bg-soft-red/10 text-soft-red rounded-xl font-semibold hover:bg-soft-red/20 transition-colors">
                  <AlertOctagon className="w-4 h-4" />
                  Recall
                </button>
              )}
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 bg-soft-red/10 text-soft-red rounded-xl font-semibold hover:bg-soft-red/20 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t-2 border-dark-brown/5">
            <div>
              <p className="text-sm text-dark-brown/60 mb-1">Manufacturing Date</p>
              <p className="font-semibold text-dark-brown">
                {format(new Date(batch.manufacturing_date), 'MMM dd, yyyy')}
              </p>
            </div>
            <div>
              <p className="text-sm text-dark-brown/60 mb-1">Expiry Date</p>
              <p className="font-semibold text-dark-brown">
                {format(new Date(batch.expiry_date), 'MMM dd, yyyy')}
              </p>
            </div>
            <div>
              <p className="text-sm text-dark-brown/60 mb-1">Total Units</p>
              <p className="font-semibold text-dark-brown">{batch.batch_size}</p>
            </div>
            <div>
              <p className="text-sm text-dark-brown/60 mb-1">In Stock</p>
              <p className="font-semibold text-sage">{batch.units_in_stock}</p>
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
            {activeTab === 'overview' && <BatchOverviewTab batch={batch} onUpdate={fetchBatch} />}
            {activeTab === 'quality' && <BatchQualityTab batchId={batch.id} batch={batch} />}
            {activeTab === 'inventory' && <BatchInventoryTab batchId={batch.id} batch={batch} onUpdate={fetchBatch} />}
            {activeTab === 'photos' && <BatchPhotosTab batchId={batch.id} />}
            {activeTab === 'traceability' && <BatchTraceabilityTab batchId={batch.id} />}
          </div>
        </div>
      </div>
    </div>
  );
}
