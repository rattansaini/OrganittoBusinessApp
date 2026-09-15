import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Leaf,
  Bell,
  Search,
  Settings,
  LogOut,
  LayoutDashboard,
  BarChart3,
  Receipt,
  Landmark,
  Building2,
  FileText,
  Package,
  ShoppingBag,
  Boxes,
  Users,
  ShieldCheck,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface NavItem {
  name: string;
  path: string;
  icon: typeof LayoutDashboard;
  badgeKey?: 'expenses' | 'investments' | 'vendors';
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { name: 'Reports', path: '/expenses/reports', icon: BarChart3 },
    ],
  },
  {
    label: 'Finance',
    items: [
      { name: 'Expenses', path: '/expenses', icon: Receipt, badgeKey: 'expenses' },
      { name: 'Investments', path: '/investments', icon: Landmark, badgeKey: 'investments' },
      { name: 'Vendors', path: '/vendors', icon: Building2, badgeKey: 'vendors' },
      { name: 'Invoices', path: '/invoices', icon: FileText },
    ],
  },
  {
    label: 'Operations',
    items: [
      { name: 'Products', path: '/products', icon: Package },
      { name: 'Sales', path: '/orders', icon: ShoppingBag },
      { name: 'Inventory', path: '/inventory', icon: Boxes },
      { name: 'Customers', path: '/customers', icon: Users },
      { name: 'Compliance', path: '/compliance', icon: ShieldCheck },
      { name: 'Chat', path: '/chat', icon: MessageSquare },
    ],
  },
];

const ALL_NAV_PATHS = NAV_GROUPS.flatMap((group) => group.items.map((item) => item.path));

interface LowStockItem {
  id: string;
  product_name: string;
  quantity_available: number;
  reorder_level: number;
}

interface UninvoicedOrder {
  id: string;
  order_number: string;
  total_amount: number;
}

interface NavCounts {
  expenses: number;
  investments: number;
  vendors: number;
}

export default function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [uninvoicedOrders, setUninvoicedOrders] = useState<UninvoicedOrder[]>([]);
  const [counts, setCounts] = useState<NavCounts>({ expenses: 0, investments: 0, vendors: 0 });

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    fetchNavCounts();
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const [inventoryRes, ordersRes, invoicesRes] = await Promise.all([
        supabase.from('finished_goods_inventory').select('id, product_name, quantity_available, reorder_level'),
        supabase.from('sales_orders').select('id, order_number, total_amount'),
        supabase.from('invoices').select('order_id'),
      ]);

      const lowStock = (inventoryRes.data || []).filter(
        (item) => item.quantity_available <= item.reorder_level
      );
      setLowStockItems(lowStock);

      const invoicedOrderIds = new Set((invoicesRes.data || []).map((inv) => inv.order_id));
      const uninvoiced = (ordersRes.data || []).filter((o) => !invoicedOrderIds.has(o.id));
      setUninvoicedOrders(uninvoiced);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchNavCounts = async () => {
    try {
      const [expensesRes, investmentsRes, vendorsRes] = await Promise.all([
        supabase.from('expenses').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('investments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('vendors').select('id', { count: 'exact', head: true }),
      ]);
      setCounts({
        expenses: expensesRes.count || 0,
        investments: investmentsRes.count || 0,
        vendors: vendorsRes.count || 0,
      });
    } catch (error) {
      console.error('Error fetching nav counts:', error);
    }
  };

  const notificationCount = lowStockItems.length + uninvoicedOrders.length;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isItemActive = (path: string) => {
    if (location.pathname === path) return true;
    const moreSpecificSiblings = ALL_NAV_PATHS.filter(
      (p) => p !== path && p.startsWith(`${path}/`)
    );
    if (moreSpecificSiblings.includes(location.pathname)) return false;
    return location.pathname.startsWith(`${path}/`);
  };

  const initials = (user?.name || 'U')
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-ground flex flex-col min-[861px]:flex-row overflow-x-hidden">
      <aside
        className="bg-[linear-gradient(176deg,#22440F_0%,#1A3409_55%,#132607_100%)] flex flex-col max-[860px]:w-full max-[860px]:sticky max-[860px]:top-0 max-[860px]:z-40 max-[860px]:flex-row max-[860px]:items-center max-[860px]:h-14 max-[860px]:px-3 max-[860px]:gap-3 min-[861px]:w-[238px] min-[861px]:flex-shrink-0 min-[861px]:h-screen min-[861px]:sticky min-[861px]:top-0 min-[861px]:z-40"
      >
        <Link
          to="/dashboard"
          className="flex items-center gap-2.5 flex-shrink-0 max-[860px]:py-0 min-[861px]:px-4 min-[861px]:pt-5 min-[861px]:pb-4"
        >
          <div
            className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(160deg,#6FA33C,#3C6B1B)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,.38)',
            }}
          >
            <Leaf className="w-4 h-4 text-white" />
          </div>
          <div className="max-[860px]:hidden min-[861px]:block">
            <p className="font-heading text-[19px] font-bold leading-none text-[#F2F5EC]">Organitto</p>
            <p className="text-[9px] font-medium tracking-[.22em] text-[#8FA678] uppercase leading-none mt-1">
              Business
            </p>
          </div>
        </Link>

        <nav
          className="min-w-0 max-[860px]:flex max-[860px]:flex-1 max-[860px]:flex-row max-[860px]:items-center max-[860px]:overflow-x-auto max-[860px]:gap-1 min-[861px]:flex-1 min-[861px]:flex min-[861px]:flex-col min-[861px]:gap-4 min-[861px]:overflow-y-auto min-[861px]:px-3 min-[861px]:py-2"
        >
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="max-[860px]:contents min-[861px]:flex min-[861px]:flex-col min-[861px]:gap-0.5">
              <p className="max-[860px]:hidden text-[9.5px] tracking-[.16em] uppercase text-[#7D9366] font-semibold px-2 mb-1">
                {group.label}
              </p>
              <div className="max-[860px]:contents min-[861px]:flex min-[861px]:flex-col min-[861px]:gap-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isItemActive(item.path);
                  const badgeCount = item.badgeKey ? counts[item.badgeKey] : 0;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`relative flex items-center gap-2.5 rounded-[9px] py-2 px-[9px] text-[13.5px] transition-colors whitespace-nowrap flex-shrink-0 ${
                        active
                          ? 'bg-white/10 text-[#F4F8EE] font-semibold'
                          : 'text-[#BCCDA8] hover:bg-white/[.055]'
                      }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] bg-gold rounded-r-sm max-[860px]:hidden" />
                      )}
                      <Icon className="w-[15px] h-[15px] flex-shrink-0" />
                      <span>{item.name}</span>
                      {badgeCount > 0 && (
                        <span className="ml-auto text-[10px] leading-none bg-white/15 text-white rounded-full px-1.5 py-1 max-[860px]:hidden">
                          {badgeCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="relative max-[860px]:hidden min-[861px]:p-3 min-[861px]:mt-auto flex-shrink-0">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-full flex items-center gap-2.5 rounded-xl bg-white/[.06] hover:bg-white/[.09] transition-colors p-2 text-left"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-[#241B04]"
              style={{ background: 'linear-gradient(135deg,#E2BE5E,#9C7620)' }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-[12.5px] font-semibold text-[#F4F8EE] truncate">{user?.name}</p>
              <p className="text-[9.5px] tracking-[.08em] uppercase text-[#8FA678] truncate">{user?.role}</p>
            </div>
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="absolute left-3 right-3 bottom-full mb-2 bg-panel rounded-xl shadow-e2 border border-edge overflow-hidden z-50">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/settings');
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-ink hover:bg-panel-2 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span className="text-body-sm font-medium">Settings</span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-soft-red hover:bg-soft-red/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-body-sm font-medium">Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="sticky top-0 z-30 bg-ground/85 backdrop-blur-md border-b border-edge">
          <div className="flex items-center justify-between gap-4 h-14 px-[26px]">
            <div className="flex items-center gap-2 bg-panel border border-edge rounded-[10px] px-3 h-9 w-full max-w-[400px]">
              <Search className="w-[15px] h-[15px] text-ink-3 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search..."
                disabled
                className="flex-1 min-w-0 bg-transparent text-body-sm text-ink placeholder:text-ink-3 outline-none disabled:cursor-default"
              />
              {/* TODO: wire up search */}
              <kbd className="max-[599px]:hidden flex-shrink-0 text-[10px] font-semibold text-ink-3 border border-edge rounded px-1.5 py-0.5">
                &#8984;K
              </kbd>
            </div>

            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-ink-2 hover:bg-panel-2 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5" />
                {notificationCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-clay rounded-full" />
                )}
              </button>

              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <div className="absolute right-0 mt-2 w-80 bg-panel rounded-xl shadow-e2 border border-edge overflow-hidden z-50">
                    <div className="p-4 bg-panel-2 border-b border-edge">
                      <p className="font-semibold text-ink">Notifications</p>
                    </div>
                    {notificationCount === 0 ? (
                      <div className="p-6 text-center text-ink-3 text-body-sm">You're all caught up.</div>
                    ) : (
                      <div className="max-h-80 overflow-y-auto">
                        {lowStockItems.map((item) => (
                          <Link
                            key={item.id}
                            to="/inventory"
                            onClick={() => setShowNotifications(false)}
                            className="flex items-start gap-3 px-4 py-3 hover:bg-panel-2 transition-colors border-b border-edge-soft"
                          >
                            <AlertTriangle className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-body-sm font-medium text-ink">Low stock: {item.product_name}</p>
                              <p className="text-[11px] text-ink-3">
                                {item.quantity_available} left (reorder at {item.reorder_level})
                              </p>
                            </div>
                          </Link>
                        ))}
                        {uninvoicedOrders.map((order) => (
                          <Link
                            key={order.id}
                            to="/invoices"
                            onClick={() => setShowNotifications(false)}
                            className="flex items-start gap-3 px-4 py-3 hover:bg-panel-2 transition-colors border-b border-edge-soft"
                          >
                            <FileText className="w-4 h-4 text-clay flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-body-sm font-medium text-ink">
                                Order {order.order_number} needs an invoice
                              </p>
                              <p className="text-[11px] text-ink-3 tabular">
                                ₹{Number(order.total_amount).toLocaleString('en-IN')}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <main className="flex-1 min-w-0 grid gap-4 pt-6 px-[26px] pb-9 [&>*]:min-w-0">{children}</main>
      </div>
    </div>
  );
}
