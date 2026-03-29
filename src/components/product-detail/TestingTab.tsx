import { useState, useEffect } from 'react';
import { Plus, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';

interface TestingTabProps {
  productId: string;
}

const testCategories = {
  stability: [
    'pH Test',
    'Viscosity Test',
    'Color Consistency',
    'Fragrance Stability',
    'Separation Test',
  ],
  safety: [
    'Patch Test Results',
    'Microbial Testing',
    'Heavy Metals Testing',
    'Allergen Testing',
  ],
  performance: [
    'Efficacy Test',
    'Shelf Life Study',
    'Consumer Testing',
  ],
};

export default function TestingTab({ productId }: TestingTabProps) {
  const { user } = useAuth();
  const [tests, setTests] = useState<any[]>([]);
  const [sampleBatches, setSampleBatches] = useState<any[]>([]);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [testForm, setTestForm] = useState({
    test_type: '',
    test_category: 'stability',
    target_value: '',
    actual_value: '',
    result: 'pending',
    test_date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [batchForm, setBatchForm] = useState({
    batch_number: '',
    quantity: '',
    unit: 'units',
    purpose: 'testing',
    batch_date: new Date().toISOString().split('T')[0],
    given_to: '',
    feedback: '',
    rating: 5,
  });

  useEffect(() => {
    fetchData();
  }, [productId]);

  const fetchData = async () => {
    try {
      const [testsRes, batchesRes] = await Promise.all([
        supabase
          .from('product_tests')
          .select('*')
          .eq('product_id', productId)
          .order('created_at', { ascending: false }),
        supabase
          .from('sample_batches')
          .select('*')
          .eq('product_id', productId)
          .order('created_at', { ascending: false }),
      ]);

      if (testsRes.error) throw testsRes.error;
      if (batchesRes.error) throw batchesRes.error;

      setTests(testsRes.data || []);
      setSampleBatches(batchesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('product_tests')
        .insert([{
          product_id: productId,
          ...testForm,
          tested_by: user?.id,
        }]);

      if (error) throw error;

      setTestForm({
        test_type: '',
        test_category: 'stability',
        target_value: '',
        actual_value: '',
        result: 'pending',
        test_date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setShowTestModal(false);
      fetchData();
    } catch (error) {
      console.error('Error adding test:', error);
    }
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('sample_batches')
        .insert([{
          product_id: productId,
          ...batchForm,
          quantity: parseFloat(batchForm.quantity) || 0,
          rating: parseInt(batchForm.rating.toString()) || 5,
          created_by: user?.id,
        }]);

      if (error) throw error;

      setBatchForm({
        batch_number: '',
        quantity: '',
        unit: 'units',
        purpose: 'testing',
        batch_date: new Date().toISOString().split('T')[0],
        given_to: '',
        feedback: '',
        rating: 5,
      });
      setShowBatchModal(false);
      fetchData();
    } catch (error) {
      console.error('Error adding batch:', error);
    }
  };

  const getResultBadge = (result: string) => {
    const badges = {
      pass: { icon: <CheckCircle className="w-4 h-4" />, color: 'bg-sage text-white' },
      fail: { icon: <XCircle className="w-4 h-4" />, color: 'bg-soft-red text-white' },
      pending: { icon: <Clock className="w-4 h-4" />, color: 'bg-accent text-white' },
    };
    return badges[result as keyof typeof badges] || badges.pending;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-2xl font-bold text-primary">Testing & Quality Control</h3>
        <div className="flex gap-3">
          <button
            onClick={() => setShowTestModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-accent to-secondary text-white rounded-xl font-semibold hover:shadow-soft transition-all"
          >
            <Plus className="w-5 h-5" />
            Add Test
          </button>
          <button
            onClick={() => setShowBatchModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sage to-primary text-white rounded-xl font-semibold hover:shadow-soft transition-all"
          >
            <Plus className="w-5 h-5" />
            Add Sample Batch
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(testCategories).map(([category, testTypes]) => {
          const categoryTests = tests.filter(t => t.test_category === category);

          return (
            <div key={category} className="bg-gradient-to-br from-cream/50 to-white rounded-xl p-6 border-2 border-dark-brown/5">
              <h4 className="font-heading text-xl font-bold text-primary mb-4 capitalize">
                {category} Testing
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {testTypes.map(testType => {
                  const test = categoryTests.find(t => t.test_type === testType);
                  const badge = test ? getResultBadge(test.result) : null;

                  return (
                    <div
                      key={testType}
                      className={`p-4 rounded-xl border-2 ${
                        test
                          ? test.result === 'pass'
                            ? 'border-sage/30 bg-sage/5'
                            : test.result === 'fail'
                            ? 'border-soft-red/30 bg-soft-red/5'
                            : 'border-accent/30 bg-accent/5'
                          : 'border-dark-brown/10 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={!!test}
                            readOnly
                            className="w-5 h-5 rounded border-2 border-dark-brown/20"
                          />
                          <span className="font-semibold text-dark-brown">{testType}</span>
                        </div>
                        {badge && (
                          <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
                            {badge.icon}
                            {test.result.toUpperCase()}
                          </span>
                        )}
                      </div>

                      {test && (
                        <div className="ml-7 space-y-1 text-sm">
                          {test.target_value && (
                            <p className="text-dark-brown/70">
                              <span className="font-semibold">Target:</span> {test.target_value}
                            </p>
                          )}
                          {test.actual_value && (
                            <p className="text-dark-brown/70">
                              <span className="font-semibold">Actual:</span> {test.actual_value}
                            </p>
                          )}
                          <p className="text-dark-brown/60">
                            Tested on {format(new Date(test.test_date), 'MMM dd, yyyy')}
                          </p>
                          {test.notes && (
                            <p className="text-dark-brown/70 italic">{test.notes}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-gradient-to-br from-cream/50 to-white rounded-xl p-6 border-2 border-dark-brown/5">
        <h4 className="font-heading text-xl font-bold text-primary mb-4">Sample Batches</h4>

        {sampleBatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sampleBatches.map(batch => (
              <div key={batch.id} className="p-4 bg-white rounded-xl border-2 border-dark-brown/5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-dark-brown text-lg">{batch.batch_number}</p>
                    <p className="text-sm text-dark-brown/60">
                      {batch.quantity} {batch.unit} • {batch.purpose}
                    </p>
                  </div>
                  {batch.rating && (
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={i < batch.rating ? 'text-accent' : 'text-dark-brown/20'}>
                          ★
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <p className="text-dark-brown/70">
                    <span className="font-semibold">Date:</span> {format(new Date(batch.batch_date), 'MMM dd, yyyy')}
                  </p>
                  {batch.given_to && (
                    <p className="text-dark-brown/70">
                      <span className="font-semibold">Given to:</span> {batch.given_to}
                    </p>
                  )}
                  {batch.feedback && (
                    <p className="text-dark-brown/70 italic">"{batch.feedback}"</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-8 text-dark-brown/50">No sample batches recorded yet</p>
        )}
      </div>

      {showTestModal && (
        <div className="fixed inset-0 bg-primary/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-soft-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-accent to-secondary p-6 rounded-t-2xl">
              <h3 className="font-heading text-2xl font-bold text-white">Add Test Result</h3>
            </div>

            <form onSubmit={handleTestSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-dark-brown mb-2">
                  Test Category
                </label>
                <select
                  required
                  value={testForm.test_category}
                  onChange={(e) => setTestForm({ ...testForm, test_category: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                >
                  <option value="stability">Stability Testing</option>
                  <option value="safety">Safety Testing</option>
                  <option value="performance">Performance Testing</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-brown mb-2">
                  Test Type <span className="text-soft-red">*</span>
                </label>
                <select
                  required
                  value={testForm.test_type}
                  onChange={(e) => setTestForm({ ...testForm, test_type: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                >
                  <option value="">Select test type</option>
                  {testCategories[testForm.test_category as keyof typeof testCategories]?.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-dark-brown mb-2">
                    Target Value
                  </label>
                  <input
                    type="text"
                    value={testForm.target_value}
                    onChange={(e) => setTestForm({ ...testForm, target_value: e.target.value })}
                    placeholder="e.g., pH 5.5"
                    className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-brown mb-2">
                    Actual Value
                  </label>
                  <input
                    type="text"
                    value={testForm.actual_value}
                    onChange={(e) => setTestForm({ ...testForm, actual_value: e.target.value })}
                    placeholder="e.g., pH 5.6"
                    className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-dark-brown mb-2">
                    Result
                  </label>
                  <select
                    value={testForm.result}
                    onChange={(e) => setTestForm({ ...testForm, result: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="pass">Pass</option>
                    <option value="fail">Fail</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-brown mb-2">
                    Test Date
                  </label>
                  <input
                    type="date"
                    value={testForm.test_date}
                    onChange={(e) => setTestForm({ ...testForm, test_date: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-brown mb-2">
                  Notes
                </label>
                <textarea
                  value={testForm.notes}
                  onChange={(e) => setTestForm({ ...testForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className="flex-1 px-6 py-3 bg-dark-brown/5 text-dark-brown font-semibold rounded-xl hover:bg-dark-brown/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-accent to-secondary text-white font-semibold rounded-xl hover:shadow-soft-lg transition-all"
                >
                  Add Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBatchModal && (
        <div className="fixed inset-0 bg-primary/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-soft-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-sage to-primary p-6 rounded-t-2xl">
              <h3 className="font-heading text-2xl font-bold text-white">Add Sample Batch</h3>
            </div>

            <form onSubmit={handleBatchSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-dark-brown mb-2">
                    Batch Number <span className="text-soft-red">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={batchForm.batch_number}
                    onChange={(e) => setBatchForm({ ...batchForm, batch_number: e.target.value })}
                    placeholder="e.g., BATCH-001"
                    className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-brown mb-2">
                    Batch Date
                  </label>
                  <input
                    type="date"
                    value={batchForm.batch_date}
                    onChange={(e) => setBatchForm({ ...batchForm, batch_date: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-dark-brown mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={batchForm.quantity}
                    onChange={(e) => setBatchForm({ ...batchForm, quantity: e.target.value })}
                    placeholder="100"
                    className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-brown mb-2">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={batchForm.unit}
                    onChange={(e) => setBatchForm({ ...batchForm, unit: e.target.value })}
                    placeholder="units/ml/g"
                    className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-brown mb-2">
                  Purpose
                </label>
                <select
                  value={batchForm.purpose}
                  onChange={(e) => setBatchForm({ ...batchForm, purpose: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                >
                  <option value="testing">Testing</option>
                  <option value="sampling">Sampling</option>
                  <option value="gifting">Gifting</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-brown mb-2">
                  Given To
                </label>
                <input
                  type="text"
                  value={batchForm.given_to}
                  onChange={(e) => setBatchForm({ ...batchForm, given_to: e.target.value })}
                  placeholder="Names of recipients"
                  className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-brown mb-2">
                  Feedback
                </label>
                <textarea
                  value={batchForm.feedback}
                  onChange={(e) => setBatchForm({ ...batchForm, feedback: e.target.value })}
                  placeholder="User feedback..."
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-brown mb-2">
                  Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setBatchForm({ ...batchForm, rating: star })}
                      className={`text-3xl ${
                        star <= batchForm.rating ? 'text-accent' : 'text-dark-brown/20'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="flex-1 px-6 py-3 bg-dark-brown/5 text-dark-brown font-semibold rounded-xl hover:bg-dark-brown/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-sage to-primary text-white font-semibold rounded-xl hover:shadow-soft-lg transition-all"
                >
                  Add Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
