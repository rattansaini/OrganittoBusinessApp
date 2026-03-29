import { useEffect, useState } from 'react';
import { CheckCircle, Circle, Plus, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';

interface LicenseComplianceTabProps {
  licenseId: string;
  license: any;
  onUpdate: () => void;
}

const DEFAULT_CHECKLISTS: any = {
  fssai: [
    'Display license at prominent location',
    'Maintain hygiene standards',
    'Source ingredients from licensed suppliers',
    'Label products correctly (FSSAI logo, license number)',
    'Maintain manufacturing records',
    'Annual returns filed',
  ],
  ayush: [
    'Follow GMP guidelines',
    'Use only approved ingredients',
    'Maintain batch records',
    'Quality control testing',
    'Proper labeling (Ayush logo)',
  ],
  gmp: [
    'Maintain clean facility',
    'Follow SOP (Standard Operating Procedures)',
    'Staff training records',
    'Equipment calibration',
    'Documented processes',
  ],
};

export default function LicenseComplianceTab({ licenseId, license, onUpdate }: LicenseComplianceTabProps) {
  const { user } = useAuth();
  const [checklist, setChecklist] = useState<any[]>([]);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    fetchChecklist();
  }, [licenseId]);

  const fetchChecklist = async () => {
    try {
      const { data, error } = await supabase
        .from('compliance_checklist')
        .select('*')
        .eq('license_id', licenseId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        const defaultItems = DEFAULT_CHECKLISTS[license.license_type] || [];
        if (defaultItems.length > 0) {
          await initializeDefaultChecklist(defaultItems);
        }
      } else {
        setChecklist(data);
      }
    } catch (error) {
      console.error('Error fetching checklist:', error);
    }
  };

  const initializeDefaultChecklist = async (items: string[]) => {
    try {
      const checklistItems = items.map(item => ({
        license_id: licenseId,
        checklist_item: item,
        completed: false,
      }));

      const { data, error } = await supabase
        .from('compliance_checklist')
        .insert(checklistItems)
        .select();

      if (error) throw error;
      setChecklist(data || []);
    } catch (error) {
      console.error('Error initializing checklist:', error);
    }
  };

  const toggleChecklistItem = async (itemId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('compliance_checklist')
        .update({
          completed: !completed,
          last_verified_date: !completed ? new Date().toISOString().split('T')[0] : null,
          verified_by: !completed ? user?.id : null,
        })
        .eq('id', itemId);

      if (error) throw error;
      await fetchChecklist();
      onUpdate();
    } catch (error) {
      console.error('Error updating checklist:', error);
    }
  };

  const addChecklistItem = async () => {
    if (!newItem.trim()) return;

    try {
      const { error } = await supabase
        .from('compliance_checklist')
        .insert([
          {
            license_id: licenseId,
            checklist_item: newItem,
            completed: false,
          },
        ]);

      if (error) throw error;
      setNewItem('');
      setShowAddItem(false);
      await fetchChecklist();
      onUpdate();
    } catch (error) {
      console.error('Error adding checklist item:', error);
    }
  };

  const completedCount = checklist.filter(item => item.completed).length;
  const totalCount = checklist.length;
  const compliancePercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-primary to-sage rounded-xl p-6 text-white">
        <h3 className="font-heading text-lg font-bold mb-4">Compliance Score</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-5xl font-bold mb-2">{compliancePercentage}%</p>
            <p className="text-white/80">
              {completedCount} of {totalCount} items completed
            </p>
          </div>
          <div className="w-32 h-32 relative">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="12"
                fill="none"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="white"
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${(compliancePercentage / 100) * 351.86} 351.86`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="font-heading text-lg font-bold text-primary">Compliance Requirements</h3>
        <button
          onClick={() => setShowAddItem(!showAddItem)}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg font-semibold hover:bg-primary/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      {showAddItem && (
        <div className="bg-cream/50 rounded-xl p-4">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Enter new compliance requirement..."
            className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none mb-3"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                addChecklistItem();
              }
            }}
          />
          <div className="flex gap-2">
            <button
              onClick={addChecklistItem}
              className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowAddItem(false);
                setNewItem('');
              }}
              className="px-4 py-2 bg-dark-brown/10 text-dark-brown rounded-lg font-semibold hover:bg-dark-brown/20 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {checklist.map(item => (
          <div
            key={item.id}
            className={`p-4 rounded-xl border-2 transition-all ${
              item.completed
                ? 'bg-sage/5 border-sage/20'
                : 'bg-white border-dark-brown/10'
            }`}
          >
            <div className="flex items-start gap-4">
              <button
                onClick={() => toggleChecklistItem(item.id, item.completed)}
                className="flex-shrink-0 mt-1"
              >
                {item.completed ? (
                  <CheckCircle className="w-6 h-6 text-sage" />
                ) : (
                  <Circle className="w-6 h-6 text-dark-brown/30 hover:text-primary transition-colors" />
                )}
              </button>

              <div className="flex-1">
                <p className={`font-semibold ${
                  item.completed ? 'text-sage line-through' : 'text-dark-brown'
                }`}>
                  {item.checklist_item}
                </p>

                {item.completed && item.last_verified_date && (
                  <p className="text-sm text-dark-brown/60 mt-1">
                    Verified on {format(new Date(item.last_verified_date), 'MMM dd, yyyy')}
                  </p>
                )}

                {item.notes && (
                  <p className="text-sm text-dark-brown/70 mt-2 italic">{item.notes}</p>
                )}

                {item.proof_url && (
                  <button className="flex items-center gap-2 mt-2 text-sm text-primary hover:underline">
                    <Upload className="w-4 h-4" />
                    View proof
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {checklist.length === 0 && (
        <div className="text-center py-12 bg-white border-2 border-dark-brown/5 rounded-xl">
          <CheckCircle className="w-16 h-16 text-dark-brown/20 mx-auto mb-4" />
          <h3 className="font-heading text-xl font-bold text-dark-brown/60 mb-2">
            No compliance requirements added
          </h3>
          <p className="text-dark-brown/40 mb-4">
            Add compliance requirements specific to this license
          </p>
          <button
            onClick={() => setShowAddItem(true)}
            className="px-6 py-3 bg-gradient-to-r from-primary to-sage text-white rounded-xl font-semibold hover:shadow-soft-lg transition-all"
          >
            Add First Requirement
          </button>
        </div>
      )}

      {compliancePercentage < 100 && checklist.length > 0 && (
        <div className="bg-accent/10 border-2 border-accent/20 rounded-xl p-6">
          <h4 className="font-semibold text-dark-brown mb-2">Pending Items</h4>
          <p className="text-sm text-dark-brown/70">
            {totalCount - completedCount} compliance requirement{totalCount - completedCount !== 1 ? 's' : ''} still need{totalCount - completedCount === 1 ? 's' : ''} to be completed to achieve 100% compliance.
          </p>
        </div>
      )}

      {compliancePercentage === 100 && checklist.length > 0 && (
        <div className="bg-sage/10 border-2 border-sage/20 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-sage" />
            <div>
              <h4 className="font-semibold text-sage text-lg">100% Compliant</h4>
              <p className="text-sm text-dark-brown/70">All compliance requirements have been met</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
