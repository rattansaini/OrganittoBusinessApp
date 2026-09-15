import { useState, useEffect } from 'react';
import { BarChart3, PieChart, Users, Calendar, Store, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import OverviewTab from '../components/reports/OverviewTab';
import CategoryAnalysisTab from '../components/reports/CategoryAnalysisTab';
import PartnerAnalysisTab from '../components/reports/PartnerAnalysisTab';
import MonthlyReportsTab from '../components/reports/MonthlyReportsTab';
import VendorAnalysisTab from '../components/reports/VendorAnalysisTab';
import { ChartSkeleton } from '../components/LoadingState';

type ReportTab = 'overview' | 'category' | 'partner' | 'monthly' | 'vendor';

export default function ExpenseReports() {
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const [expenses, setExpenses] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [expensesRes, investmentsRes, vendorsRes] = await Promise.all([
        supabase
          .from('expenses')
          .select(`
            *,
            users:user_id(name, email),
            users_paid_by:users!expenses_paid_by_fkey(name, email),
            users_submitted_by:users!expenses_submitted_by_fkey(name),
            users_approved_by:users!expenses_approved_by_fkey(name),
            vendors(id, name, category)
          `)
          .order('expense_date', { ascending: false }),
        supabase
          .from('investments')
          .select(`
            *,
            users:partner_id(name, email),
            users_submitted_by:users!investments_submitted_by_fkey(name)
          `)
          .order('investment_date', { ascending: false }),
        supabase
          .from('vendors')
          .select('*')
          .order('name'),
      ]);

      if (expensesRes.error) throw expensesRes.error;
      if (investmentsRes.error) throw investmentsRes.error;
      if (vendorsRes.error) throw vendorsRes.error;

      setExpenses(expensesRes.data || []);
      setInvestments(investmentsRes.data || []);
      setVendors(vendorsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: TrendingUp },
    { id: 'category', name: 'Category Analysis', icon: PieChart },
    { id: 'partner', name: 'Partner Analysis', icon: Users },
    { id: 'monthly', name: 'Monthly Reports', icon: Calendar },
    { id: 'vendor', name: 'Vendor Analysis', icon: Store },
  ] as const;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="font-heading text-5xl font-bold text-primary mb-2">
          Financial Reports
        </h2>
        <p className="text-dark-brown/70 text-lg">
          Comprehensive analysis of investments, expenses, and financial trends
        </p>
      </div>

      <div className="bg-panel border border-edge rounded-2xl shadow-e1 p-2 mb-8 inline-flex gap-2 flex-wrap">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-accent to-secondary text-white shadow-soft'
                  : 'text-dark-brown hover:bg-accent/10'
              }`}
            >
              <Icon className="w-5 h-5" />
              {tab.name}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="bg-panel border border-edge rounded-2xl shadow-e1 p-6">
          <ChartSkeleton height={280} />
        </div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <OverviewTab
              expenses={expenses}
              investments={investments}
              vendors={vendors}
            />
          )}
          {activeTab === 'category' && (
            <CategoryAnalysisTab expenses={expenses} />
          )}
          {activeTab === 'partner' && (
            <PartnerAnalysisTab
              expenses={expenses}
              investments={investments}
            />
          )}
          {activeTab === 'monthly' && (
            <MonthlyReportsTab
              expenses={expenses}
              investments={investments}
            />
          )}
          {activeTab === 'vendor' && (
            <VendorAnalysisTab
              expenses={expenses}
              vendors={vendors}
            />
          )}
        </>
      )}
    </div>
  );
}
