import { useEffect, useState } from 'react';
import { Plus, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface BatchQualityTabProps {
  batchId: string;
  batch: any;
}

export default function BatchQualityTab({ batchId, batch }: BatchQualityTabProps) {
  const [tests, setTests] = useState<any[]>([]);

  useEffect(() => {
    fetchTests();
  }, [batchId]);

  const fetchTests = async () => {
    try {
      const { data, error } = await supabase
        .from('batch_tests')
        .select('*')
        .eq('batch_id', batchId)
        .order('test_date', { ascending: false });

      if (error) throw error;
      setTests(data || []);
    } catch (error) {
      console.error('Error fetching tests:', error);
    }
  };

  const qcChecklist = batch.qc_checklist || {};

  const checklistItems = [
    { key: 'ingredientsVerified', label: 'All ingredients verified' },
    { key: 'formulaFollowed', label: 'Formula followed correctly' },
    { key: 'phTestPassed', label: 'pH test passed' },
    { key: 'visualInspectionPassed', label: 'Visual inspection passed' },
    { key: 'packagingChecked', label: 'Packaging quality checked' },
    { key: 'labelsApplied', label: 'Labels applied correctly' },
    { key: 'batchApproved', label: 'Batch approved for distribution' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-cream/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-lg font-bold text-primary">QC Checklist</h3>
            {batch.qc_approved && (
              <span className="flex items-center gap-2 px-3 py-1 bg-sage/10 text-sage rounded-full text-sm font-bold">
                <CheckCircle className="w-4 h-4" />
                Approved
              </span>
            )}
          </div>

          <div className="space-y-3">
            {checklistItems.map(item => (
              <div
                key={item.key}
                className="flex items-center gap-3 p-3 bg-white rounded-lg"
              >
                {qcChecklist[item.key] ? (
                  <CheckCircle className="w-5 h-5 text-sage flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-dark-brown/20 flex-shrink-0" />
                )}
                <span className={`text-sm font-semibold ${
                  qcChecklist[item.key] ? 'text-dark-brown' : 'text-dark-brown/40'
                }`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {batch.qc_notes && (
            <div className="mt-4 p-4 bg-white rounded-lg">
              <p className="text-sm font-semibold text-dark-brown/60 mb-2">QC Notes</p>
              <p className="text-sm text-dark-brown">{batch.qc_notes}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white border-2 border-dark-brown/5 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-lg font-bold text-primary">Test Results</h3>
              <button className="flex items-center gap-2 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg font-semibold transition-colors">
                <Plus className="w-4 h-4" />
                Add Test
              </button>
            </div>

            {tests.length > 0 ? (
              <div className="space-y-3">
                {tests.map(test => (
                  <div
                    key={test.id}
                    className="p-4 bg-cream/50 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-dark-brown">{test.test_type}</h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        test.result.toLowerCase().includes('pass')
                          ? 'bg-sage/10 text-sage'
                          : test.result.toLowerCase().includes('fail')
                          ? 'bg-soft-red/10 text-soft-red'
                          : 'bg-accent/10 text-accent'
                      }`}>
                        {test.result}
                      </span>
                    </div>
                    <p className="text-sm text-dark-brown/60">
                      Tested on: {new Date(test.test_date).toLocaleDateString()}
                    </p>
                    {test.notes && (
                      <p className="text-sm text-dark-brown mt-2">{test.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-dark-brown/20 mx-auto mb-2" />
                <p className="text-sm text-dark-brown/60">No test results recorded</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
