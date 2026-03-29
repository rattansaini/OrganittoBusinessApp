import { useState, useEffect } from 'react';
import { Plus, LayoutGrid, List, Filter, Package, Rocket, CheckCircle, AlertTriangle } from 'lucide-react';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import AddProductModal from '../components/AddProductModal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const stages = [
  { id: 'idea', name: 'Idea', icon: '🌱', gradient: 'from-sage/30 to-sage/10' },
  { id: 'research', name: 'Research', icon: '🔍', gradient: 'from-sage/25 to-sage/10' },
  { id: 'formula', name: 'Formula Creation', icon: '⚗️', gradient: 'from-sage/20 to-accent/10' },
  { id: 'testing', name: 'Testing', icon: '🧪', gradient: 'from-accent/30 to-accent/10' },
  { id: 'packaging', name: 'Packaging Design', icon: '📦', gradient: 'from-accent/25 to-accent/10' },
  { id: 'printing', name: 'Printing', icon: '🖨️', gradient: 'from-accent/20 to-secondary/10' },
  { id: 'production', name: 'Production', icon: '🏭', gradient: 'from-secondary/30 to-secondary/10' },
  { id: 'ready', name: 'Ready to Launch', icon: '🚀', gradient: 'from-secondary/25 to-secondary/10' },
  { id: 'launched', name: 'Launched', icon: '✅', gradient: 'from-primary/40 to-primary/20' },
];

export default function ProductPipeline() {
  const { user } = useAuth();
  const [view, setView] = useState<'board' | 'list'>('board');
  const [showModal, setShowModal] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedProduct, setDraggedProduct] = useState<any>(null);
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, usersRes] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('users')
          .select('id, name, email')
          .order('name'),
      ]);

      if (productsRes.error) throw productsRes.error;
      if (usersRes.error) throw usersRes.error;

      setProducts(productsRes.data || []);
      setUsers(usersRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (productData: any) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([{
          ...productData,
          created_by: user?.id,
          stage_entered_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('product_stage_history')
        .insert([{
          product_id: data.id,
          stage: productData.current_stage,
          moved_by: user?.id,
          notes: 'Product created',
        }]);

      await fetchData();
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  };

  const handleDragStart = (product: any) => {
    setDraggedProduct(product);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    if (!draggedProduct || draggedProduct.current_stage === targetStage) {
      setDraggedProduct(null);
      return;
    }

    if (targetStage === 'launched') {
      const confirmed = window.confirm(
        `Are you sure you want to launch "${draggedProduct.name}"? This marks it as complete.`
      );
      if (!confirmed) {
        setDraggedProduct(null);
        return;
      }
    }

    try {
      await supabase
        .from('product_stage_history')
        .update({ exited_at: new Date().toISOString() })
        .eq('product_id', draggedProduct.id)
        .is('exited_at', null);

      await supabase
        .from('products')
        .update({
          current_stage: targetStage,
          stage_entered_at: new Date().toISOString(),
          progress: targetStage === 'launched' ? 100 : draggedProduct.progress,
        })
        .eq('id', draggedProduct.id);

      await supabase
        .from('product_stage_history')
        .insert([{
          product_id: draggedProduct.id,
          stage: targetStage,
          moved_by: user?.id,
        }]);

      await fetchData();
    } catch (error) {
      console.error('Error moving product:', error);
    } finally {
      setDraggedProduct(null);
    }
  };

  const handleMoveNext = async (product: any) => {
    const currentIndex = stages.findIndex(s => s.id === product.current_stage);
    if (currentIndex === -1 || currentIndex === stages.length - 1) return;

    const nextStage = stages[currentIndex + 1].id;
    await handleDrop({ preventDefault: () => {} } as React.DragEvent, nextStage);
  };

  const handleEdit = (product: any) => {
    console.log('Edit product:', product);
  };

  const filteredProducts = products.filter(p => {
    if (filterPriority !== 'all' && p.priority !== filterPriority) return false;
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const totalProducts = products.length;
  const inDevelopment = products.filter(p => p.current_stage !== 'launched').length;
  const launched = products.filter(p => p.current_stage === 'launched').length;
  const highPriority = products.filter(p => p.priority === 'high').length;

  return (
    <div className="min-h-screen bg-cream relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232D5016' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <Header />

      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-secondary to-accent text-white rounded-full shadow-soft-lg hover:shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center z-40 group"
      >
        <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
      </button>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-[1800px] mx-auto">
          <div className="mb-8">
            <h2 className="font-heading text-5xl font-bold text-primary mb-2">
              Product Development Pipeline
            </h2>
            <p className="text-dark-brown/70 text-lg">
              Track your Ayurvedic products from concept to launch
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl p-6 border-2 border-primary/30 shadow-soft">
              <div className="flex items-center gap-3 mb-2">
                <Package className="w-6 h-6 text-primary" />
                <span className="text-sm font-semibold text-dark-brown/70">Total Products</span>
              </div>
              <p className="text-4xl font-bold text-primary">{totalProducts}</p>
            </div>

            <div className="bg-gradient-to-br from-accent/20 to-accent/10 rounded-xl p-6 border-2 border-accent/30 shadow-soft">
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="w-6 h-6 text-accent" />
                <span className="text-sm font-semibold text-dark-brown/70">In Development</span>
              </div>
              <p className="text-4xl font-bold text-accent">{inDevelopment}</p>
            </div>

            <div className="bg-gradient-to-br from-sage/20 to-sage/10 rounded-xl p-6 border-2 border-sage/30 shadow-soft">
              <div className="flex items-center gap-3 mb-2">
                <Rocket className="w-6 h-6 text-sage" />
                <span className="text-sm font-semibold text-dark-brown/70">Launched</span>
              </div>
              <p className="text-4xl font-bold text-sage">{launched}</p>
            </div>

            <div className="bg-gradient-to-br from-soft-red/20 to-soft-red/10 rounded-xl p-6 border-2 border-soft-red/30 shadow-soft">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-6 h-6 text-soft-red" />
                <span className="text-sm font-semibold text-dark-brown/70">High Priority</span>
              </div>
              <p className="text-4xl font-bold text-soft-red">{highPriority}</p>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft p-4 mb-8 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setView('board')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                  view === 'board'
                    ? 'bg-gradient-to-r from-accent to-secondary text-white shadow-soft'
                    : 'text-dark-brown hover:bg-accent/10'
                }`}
              >
                <LayoutGrid className="w-5 h-5" />
                Board View
              </button>
              <button
                onClick={() => setView('list')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                  view === 'list'
                    ? 'bg-gradient-to-r from-accent to-secondary text-white shadow-soft'
                    : 'text-dark-brown hover:bg-accent/10'
                }`}
              >
                <List className="w-5 h-5" />
                List View
              </button>
            </div>

            <div className="flex gap-3 flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-4 py-2 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                <option value="all">All Priorities</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft">
              <p className="text-dark-brown/50">Loading products...</p>
            </div>
          ) : view === 'board' ? (
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-4 min-w-max">
                {stages.map(stage => {
                  const stageProducts = filteredProducts.filter(p => p.current_stage === stage.id);
                  return (
                    <div
                      key={stage.id}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, stage.id)}
                      className={`w-80 flex-shrink-0 bg-gradient-to-b ${stage.gradient} rounded-2xl p-4 border-2 border-dark-brown/10 shadow-soft`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-heading text-lg font-bold text-primary flex items-center gap-2">
                          <span className="text-2xl">{stage.icon}</span>
                          {stage.name}
                        </h3>
                        <span className="bg-white px-3 py-1 rounded-full text-sm font-bold text-primary shadow-sm">
                          {stageProducts.length}
                        </span>
                      </div>

                      <div className="space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto pr-2">
                        {stageProducts.length === 0 ? (
                          <div className="text-center py-8 text-dark-brown/40 text-sm">
                            No products in this stage
                          </div>
                        ) : (
                          stageProducts.map(product => (
                            <ProductCard
                              key={product.id}
                              product={product}
                              users={users}
                              onDragStart={handleDragStart}
                              onEdit={handleEdit}
                              onMoveNext={handleMoveNext}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-cream/50 border-b-2 border-accent/10">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-dark-brown">Product</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-dark-brown">Category</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-dark-brown">Stage</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-dark-brown">Priority</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-dark-brown">Progress</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-dark-brown">Days in Stage</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-dark-brown">Target Launch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product, index) => {
                      const stage = stages.find(s => s.id === product.current_stage);
                      const daysInStage = Math.floor(
                        (new Date().getTime() - new Date(product.stage_entered_at).getTime()) / (1000 * 60 * 60 * 24)
                      );
                      return (
                        <tr
                          key={product.id}
                          className={`border-b border-dark-brown/5 ${
                            index % 2 === 0 ? 'bg-white' : 'bg-cream/20'
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-sage/20 rounded-lg flex items-center justify-center text-2xl">
                                {stage?.icon}
                              </div>
                              <div>
                                <p className="font-semibold text-primary">{product.name}</p>
                                <p className="text-xs text-dark-brown/60">{product.product_type}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm px-2 py-1 bg-primary/10 text-primary rounded-full font-semibold">
                              {product.category}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-sm px-3 py-1 bg-gradient-to-r ${stage?.gradient} rounded-full font-semibold text-dark-brown`}>
                              {stage?.name}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded-full font-semibold text-white ${
                              product.priority === 'high' ? 'bg-soft-red' :
                              product.priority === 'medium' ? 'bg-accent' : 'bg-sage'
                            }`}>
                              {product.priority.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-dark-brown/10 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-sage to-accent"
                                  style={{ width: `${product.progress}%` }}
                                />
                              </div>
                              <span className="text-sm font-bold text-accent">{product.progress}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-sm ${daysInStage > 30 ? 'text-soft-red font-semibold' : 'text-dark-brown/70'}`}>
                              {daysInStage} days
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-dark-brown/70">
                              {product.target_launch_date || '-'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {filteredProducts.length === 0 && !loading && (
            <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft">
              <span className="text-6xl mb-4 block">🌱</span>
              <h3 className="font-heading text-2xl font-bold text-primary mb-2">
                No products yet!
              </h3>
              <p className="text-dark-brown/60 mb-6">
                Create your first Ayurvedic product to get started
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-sage to-primary text-white font-semibold rounded-xl hover:shadow-soft-lg transition-all duration-300"
              >
                Create Product
              </button>
            </div>
          )}
        </div>
      </div>

      <AddProductModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleCreateProduct}
        users={users}
      />
    </div>
  );
}
