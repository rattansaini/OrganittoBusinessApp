import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { format, subMonths, startOfMonth } from 'date-fns';
import { CardSkeleton } from '../components/LoadingState';
import MonthlyDeploymentChart, { MonthlyDeploymentPoint } from '../components/dashboard/MonthlyDeploymentChart';
import CategoryBreakdown, { CategorySlice } from '../components/dashboard/CategoryBreakdown';
import VendorActivityTable, { VendorActivityRow } from '../components/dashboard/VendorActivityTable';

const CATEGORY_LABELS: Record<string, string> = {
  raw_materials: 'Raw Materials',
  packaging: 'Packaging',
  printing: 'Printing',
  shipping: 'Shipping & Logistics',
  marketing: 'Marketing & Advertising',
  lab_testing: 'Lab Testing',
  licenses: 'Licenses & Compliance',
  utilities: 'Utilities',
  rent: 'Rent & Infrastructure',
  salaries: 'Salaries & Wages',
  equipment: 'Equipment & Machinery',
  other: 'Other',
};

const CATEGORY_COLORS: Record<string, string> = {
  raw_materials: '#2D5016',
  marketing: '#6E9440',
  other: '#C0982F',
  shipping: '#B44A2B',
};
const FALLBACK_CATEGORY_COLORS = ['#2D5016', '#6E9440', '#C0982F', '#B44A2B', '#4C7A28', '#969C8D'];

interface KpiCardProps {
  label: string;
  amount: number;
  rail: string;
  sub?: string;
}

function KpiCard({ label, amount, rail, sub }: KpiCardProps) {
  const [rupees, paise] = amount.toFixed(2).split('.');
  const rupeesFormatted = Number(rupees).toLocaleString('en-IN');

  return (
    <div className="relative bg-panel border border-edge rounded-[14px] shadow-e1 overflow-hidden pl-[21px] pr-[18px] py-[17px]">
      <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: rail }} />
      <p className="text-label uppercase text-ink-3">{label}</p>
      <p className="text-fig font-bold tabular text-ink mt-2">
        ₹{rupeesFormatted}
        <span className="text-body-sm font-normal text-ink-3">.{paise}</span>
      </p>
      {sub && <p className="text-body-sm text-ink-2 mt-1">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);

  const [capitalRaised, setCapitalRaised] = useState(0);
  const [totalDeployed, setTotalDeployed] = useState(0);
  const [shopifyRevenue, setShopifyRevenue] = useState(0);
  const [monthlyDeployment, setMonthlyDeployment] = useState<MonthlyDeploymentPoint[]>([]);
  const [periodEntryCount, setPeriodEntryCount] = useState(0);
  const [categories, setCategories] = useState<CategorySlice[]>([]);
  const [insight, setInsight] = useState<string | null>(null);
  const [vendorRows, setVendorRows] = useState<VendorActivityRow[]>([]);

  const currentDate = format(new Date(), 'EEEE, MMMM d, yyyy');

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5)).toISOString().split('T')[0];

      const [investmentsRes, expensesRes, salesRes, vendorInvoicesRes] = await Promise.all([
        supabase
          .from('investments')
          .select('amount, status')
          .eq('status', 'approved'),
        supabase
          .from('expenses')
          .select('id, amount, expense_date, category, purpose, vendor_id, status, vendors(name)')
          .eq('status', 'approved'),
        supabase
          .from('sales_orders')
          .select('total_amount'),
        supabase
          .from('vendor_invoices')
          .select('vendor_id, amount, status, vendors(name, category)'),
      ]);

      if (investmentsRes.error) throw investmentsRes.error;
      if (expensesRes.error) throw expensesRes.error;
      if (salesRes.error) throw salesRes.error;
      if (vendorInvoicesRes.error) throw vendorInvoicesRes.error;

      const investments = investmentsRes.data || [];
      const expenses = expensesRes.data || [];

      const totalInvestments = investments.reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0);
      const totalExpenses = expenses.reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0);
      const totalSales = (salesRes.data || []).reduce(
        (sum, item) => sum + parseFloat(item.total_amount.toString()),
        0
      );

      setCapitalRaised(totalInvestments);
      setTotalDeployed(totalExpenses);
      setShopifyRevenue(totalSales);

      const months: { key: string; label: string; total: number; count: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(new Date(), i);
        months.push({ key: format(d, 'yyyy-MM'), label: format(d, 'MMM'), total: 0, count: 0 });
      }
      const monthMap = new Map(months.map((m) => [m.key, m]));

      expenses
        .filter((exp) => exp.expense_date >= sixMonthsAgo)
        .forEach((exp) => {
          const key = exp.expense_date.slice(0, 7);
          const bucket = monthMap.get(key);
          if (bucket) {
            bucket.total += parseFloat(exp.amount.toString());
            bucket.count += 1;
          }
        });

      setMonthlyDeployment(months.map((m) => ({ month: m.label, total: m.total })));
      setPeriodEntryCount(months.reduce((sum, m) => sum + m.count, 0));

      const categoryTotals: Record<string, number> = {};
      expenses.forEach((exp) => {
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + parseFloat(exp.amount.toString());
      });
      const topCategories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([key, value], index) => ({
          label: CATEGORY_LABELS[key] || key,
          value,
          color: CATEGORY_COLORS[key] || FALLBACK_CATEGORY_COLORS[index % FALLBACK_CATEGORY_COLORS.length],
        }));
      setCategories(topCategories);

      if (expenses.length > 0 && totalExpenses > 0) {
        const largest = expenses.reduce((max, exp) =>
          parseFloat(exp.amount.toString()) > parseFloat(max.amount.toString()) ? exp : max
        );
        const largestAmount = parseFloat(largest.amount.toString());
        const pct = (largestAmount / totalExpenses) * 100;
        const who = (largest.vendors as any)?.name || CATEGORY_LABELS[largest.category] || largest.category;
        setInsight(`A single ${who} purchase accounts for ${pct.toFixed(1)}% of all spending to date.`);
      } else {
        setInsight(null);
      }

      const vendorMap = new Map<string, { name: string; category: string; count: number; total: number; statuses: Set<string> }>();
      (vendorInvoicesRes.data || []).forEach((inv: any) => {
        if (!inv.vendor_id || !inv.vendors) return;
        const existing = vendorMap.get(inv.vendor_id) || {
          name: inv.vendors.name,
          category: inv.vendors.category || 'Other',
          count: 0,
          total: 0,
          statuses: new Set<string>(),
        };
        existing.count += 1;
        existing.total += parseFloat(inv.amount.toString());
        existing.statuses.add(inv.status);
        vendorMap.set(inv.vendor_id, existing);
      });
      const rows: VendorActivityRow[] = Array.from(vendorMap.entries())
        .map(([id, v]) => ({
          id,
          name: v.name,
          category: v.category,
          invoiceCount: v.count,
          total: v.total,
          status: (v.statuses.has('overdue') ? 'overdue' : v.statuses.has('pending') ? 'pending' : 'paid') as VendorActivityRow['status'],
        }))
        .sort((a, b) => b.total - a.total);
      setVendorRows(rows);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const runwayBalance = capitalRaised - totalDeployed;
  const pctDeployed = capitalRaised > 0 ? (totalDeployed / capitalRaised) * 100 : 0;
  const pctRemaining = capitalRaised > 0 ? (runwayBalance / capitalRaised) * 100 : 0;

  return (
    <div className="max-w-7xl mx-auto w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-h1 font-heading font-bold text-ink">Financial Overview</h1>
          <p className="text-body-sm text-ink-2 mt-1">{currentDate} · Vedaant Enterprises</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => toast.info('Export feature coming soon')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-ink font-semibold text-body-sm bg-panel border border-edge hover:bg-panel-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => navigate('/expenses/add')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-body-sm bg-gradient-to-b from-[#3B6720] to-[#2A4B14] border border-[#1E3A0D] shadow-[inset_0_1px_0_rgba(255,255,255,.2)] shadow-e1 hover:-translate-y-[1px] transition-transform"
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </button>
        </div>
      </div>

      {loading ? (
        <CardSkeleton count={4} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <KpiCard
              label="Capital Raised"
              amount={capitalRaised}
              rail="linear-gradient(180deg,#4C7A28,#1F3F10)"
            />
            <KpiCard
              label="Total Deployed"
              amount={totalDeployed}
              rail="#B44A2B"
              sub={`${pctDeployed.toFixed(1)}% of capital`}
            />
            <KpiCard
              label="Runway Balance"
              amount={runwayBalance}
              rail="#C0982F"
              sub={`${pctRemaining.toFixed(1)}% remaining`}
            />
            <KpiCard label="Shopify Revenue" amount={shopifyRevenue} rail="#4C7A28" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4 mb-4">
            <MonthlyDeploymentChart data={monthlyDeployment} entryCount={periodEntryCount} />
            <CategoryBreakdown categories={categories} totalSpend={totalDeployed} insight={insight} />
          </div>

          <VendorActivityTable rows={vendorRows} />
        </>
      )}
    </div>
  );
}
