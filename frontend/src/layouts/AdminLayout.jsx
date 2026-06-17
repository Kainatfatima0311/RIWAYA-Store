import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Warehouse,
  Wrench,
  Truck,
  Package,
  Boxes,
  ShoppingBag,
  Users,
  UserCog,
  Receipt,
  CreditCard,
  PieChart,
  FileBarChart,
  LogOut,
  Menu,
  X,
  Tag,
  Tags,
  ListOrdered,
  BookOpen,
} from 'lucide-react';
import { useState, Suspense } from 'react';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectUser, clearUser } from '@/store/slices/authSlice';
import { useLogoutMutation } from '@/api/authApi';
import { PageSpinner } from '@/components/ui/Spinner';
import { BRAND_NAME } from '@/lib/constants';
import { cn } from '@/lib/utils';

const SECTIONS = [
  {
    label: 'Overview',
    items: [
      { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
      { to: '/admin/guide', icon: BookOpen, label: 'Getting Started' },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { to: '/admin/products', icon: Package, label: 'Products' },
      { to: '/admin/product-categories', icon: Tag, label: 'Categories' },
    ],
  },
  {
    label: 'Inventory',
    items: [
      { to: '/admin/stock', icon: Boxes, label: 'Stock Items' },
      { to: '/admin/stock-movements', icon: ListOrdered, label: 'Movements' },
      { to: '/admin/warehouses', icon: Warehouse, label: 'Warehouses' },
      { to: '/admin/rack-categories', icon: Tags, label: 'Rack Categories' },
      { to: '/admin/equipment', icon: Wrench, label: 'Equipment' },
    ],
  },
  {
    label: 'Procurement',
    items: [
      { to: '/admin/suppliers', icon: Truck, label: 'Suppliers' },
      { to: '/admin/purchase-orders', icon: Receipt, label: 'Purchase Orders' },
    ],
  },
  {
    label: 'Sales',
    items: [
      { to: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
      { to: '/admin/payments', icon: CreditCard, label: 'Payments' },
    ],
  },
  {
    label: 'People',
    items: [
      { to: '/admin/customers', icon: Users, label: 'Customers' },
      { to: '/admin/employees', icon: UserCog, label: 'Employees' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { to: '/admin/finance', icon: PieChart, label: 'Finance' },
      { to: '/admin/reports', icon: FileBarChart, label: 'Reports' },
    ],
  },
];

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const user = useAppSelector(selectUser);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [logout] = useLogoutMutation();

  const handleLogout = async () => {
    try { await logout().unwrap(); } catch {/* ignore */}
    localStorage.removeItem('riwaya_token');
    dispatch(clearUser());
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 inset-y-0 left-0 z-40 w-64 bg-card border-r flex flex-col transition-transform',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b">
          <Link to="/admin" className="font-serif text-xl text-primary transition-colors hover:text-primary-hover">{BRAND_NAME} <span className="text-xs text-muted-foreground">admin</span></Link>
          <button className="lg:hidden text-foreground/70 transition-colors hover:text-foreground" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          {SECTIONS.map((sec) => (
            <div key={sec.label}>
              <div className="px-2 text-xs uppercase tracking-wider text-muted-foreground mb-1">{sec.label}</div>
              <ul className="space-y-0.5">
                {sec.items.map((it) => (
                  <li key={it.to}>
                    <NavLink
                      to={it.to}
                      end={it.end}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'group flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-all duration-200',
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-foreground/80 hover:bg-accent/30 hover:translate-x-0.5'
                        )
                      }
                    >
                      <it.icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                      {it.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate">{user?.name}</div>
            <div className="text-xs text-muted-foreground capitalize">{user?.role?.replace('_', ' ')}</div>
          </div>
          <button onClick={handleLogout} className="p-1.5 rounded text-destructive transition-colors hover:bg-destructive/10" title="Logout">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Backdrop (mobile) */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden animate-fade-in" onClick={() => setOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 border-b bg-background flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20">
          <button className="lg:hidden p-2 text-foreground/70 transition-colors hover:text-foreground" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="text-sm text-muted-foreground hidden md:block">
            Welcome back, <span className="font-medium text-foreground">{user?.name?.split(' ')[0]}</span>
          </div>
          <Link to="/admin" className="lg:hidden font-serif text-lg text-primary transition-colors hover:text-primary-hover">{BRAND_NAME}</Link>
        </header>

        <main className="flex-1 p-4 lg:p-6 max-w-full">
          <div key={location.pathname} className="animate-fade-up-sm">
            <Suspense fallback={<PageSpinner />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
