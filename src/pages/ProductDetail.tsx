import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, ArrowRight, Share2, Archive, FileText, Leaf, TestTube, Package as PackageIcon, CheckSquare, MessageSquare, FolderOpen } from 'lucide-react';
import Header from '../components/Header';
import OverviewTab from '../components/product-detail/OverviewTab';
import IngredientsTab from '../components/product-detail/IngredientsTab';
import TestingTab from '../components/product-detail/TestingTab';
import PackagingTab from '../components/product-detail/PackagingTab';
import TasksTab from '../components/product-detail/TasksTab';
import DiscussionTab from '../components/product-detail/DiscussionTab';
import FilesTab from '../components/product-detail/FilesTab';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const tabs = [
  { id: 'overview', name: 'Overview', icon: FileText },
  { id: 'ingredients', name: 'Ingredients & Formula', icon: Leaf },
  { id: 'testing', name: 'Testing & Quality', icon: TestTube },
  { id: 'packaging', name: 'Packaging', icon: PackageIcon },
  { id: 'tasks', name: 'Tasks & Checklist', icon: CheckSquare },
  { id: 'discussion', name: 'Team Discussion', icon: MessageSquare },
  { id: 'files', name: 'Files & Documents', icon: FolderOpen },
];

const stages = [
  { id: 'idea', name: 'Idea', color: 'bg-sage' },
  { id: 'research', name: 'Research', color: 'bg-sage' },
  { id: 'formula', name: 'Formula Creation', color: 'bg-accent' },
  { id: 'testing', name: 'Testing', color: 'bg-accent' },
  { id: 'packaging', name: 'Packaging Design', color: 'bg-secondary' },
  { id: 'printing', name: 'Printing', color: 'bg-secondary' },
  { id: 'production', name: 'Production', color: 'bg-secondary' },
  { id: 'ready', name: 'Ready to Launch', color: 'bg-primary' },
  { id: 'launched', name: 'Launched', color: 'bg-primary' },
];

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMoveNext = async () => {
    if (!product) return;

    const currentIndex = stages.findIndex(s => s.id === product.current_stage);
    if (currentIndex === -1 || currentIndex === stages.length - 1) return;

    const nextStage = stages[currentIndex + 1];

    if (nextStage.id === 'launched') {
      const confirmed = window.confirm(
        `Are you sure you want to launch "${product.name}"? This marks it as complete.`
      );
      if (!confirmed) return;
    }

    try {
      await supabase
        .from('product_stage_history')
        .update({ exited_at: new Date().toISOString() })
        .eq('product_id', product.id)
        .is('exited_at', null);

      await supabase
        .from('products')
        .update({
          current_stage: nextStage.id,
          stage_entered_at: new Date().toISOString(),
          progress: nextStage.id === 'launched' ? 100 : product.progress,
        })
        .eq('id', product.id);

      await supabase
        .from('product_stage_history')
        .insert([{
          product_id: product.id,
          stage: nextStage.id,
          moved_by: user?.id,
        }]);

      await fetchProduct();
    } catch (error) {
      console.error('Error moving product:', error);
    }
  };

  const getPriorityBadge = (priority: string) => {
    const badges = {
      high: { color: 'bg-soft-red', text: 'HIGH' },
      medium: { color: 'bg-accent', text: 'MEDIUM' },
      low: { color: 'bg-sage', text: 'LOW' },
    };
    return badges[priority as keyof typeof badges] || badges.medium;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-dark-brown/50">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-dark-brown/50">Product not found</p>
        </div>
      </div>
    );
  }

  const currentStage = stages.find(s => s.id === product.current_stage);
  const priorityBadge = getPriorityBadge(product.priority);

  return (
    <div className="min-h-screen bg-cream">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/products')}
          className="flex items-center gap-2 text-dark-brown/70 hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Pipeline
        </button>

        <div className="bg-white rounded-2xl shadow-soft p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <h1 className="font-heading text-4xl font-bold text-primary mb-3">
                {product.name}
              </h1>

              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                  {product.category}
                </span>
                <span className={`px-3 py-1 ${priorityBadge.color} text-white rounded-full text-sm font-semibold`}>
                  {priorityBadge.text}
                </span>
                {currentStage && (
                  <span className={`px-4 py-1 ${currentStage.color} text-white rounded-full text-sm font-semibold`}>
                    {currentStage.name}
                  </span>
                )}
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-dark-brown/70">Stage Progress</span>
                  <span className="text-sm font-bold text-accent">{product.progress}%</span>
                </div>
                <div className="w-full h-3 bg-dark-brown/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sage to-accent transition-all duration-300"
                    style={{ width: `${product.progress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate(`/products/${id}/edit`)}
                className="flex items-center gap-2 px-4 py-2 bg-dark-brown/5 hover:bg-dark-brown/10 text-dark-brown rounded-xl font-semibold transition-colors"
              >
                <Edit className="w-5 h-5" />
                Edit
              </button>
              <button
                onClick={handleMoveNext}
                disabled={product.current_stage === 'launched'}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sage to-primary text-white rounded-xl font-semibold hover:shadow-soft transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowRight className="w-5 h-5" />
                Move to Next Stage
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-dark-brown/5 hover:bg-dark-brown/10 text-dark-brown rounded-xl font-semibold transition-colors">
                <Share2 className="w-5 h-5" />
                Share
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-soft-red/10 hover:bg-soft-red/20 text-soft-red rounded-xl font-semibold transition-colors">
                <Archive className="w-5 h-5" />
                Archive
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
          <div className="border-b-2 border-dark-brown/5">
            <div className="overflow-x-auto">
              <div className="flex min-w-max">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all duration-300 border-b-4 ${
                        activeTab === tab.id
                          ? 'border-accent text-accent bg-accent/5'
                          : 'border-transparent text-dark-brown/60 hover:text-primary hover:bg-primary/5'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="whitespace-nowrap">{tab.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && <OverviewTab product={product} onRefresh={fetchProduct} />}
            {activeTab === 'ingredients' && <IngredientsTab productId={product.id} />}
            {activeTab === 'testing' && <TestingTab productId={product.id} />}
            {activeTab === 'packaging' && <PackagingTab productId={product.id} />}
            {activeTab === 'tasks' && <TasksTab productId={product.id} />}
            {activeTab === 'discussion' && <DiscussionTab productId={product.id} />}
            {activeTab === 'files' && <FilesTab productId={product.id} />}
          </div>
        </div>
      </div>
    </div>
  );
}
