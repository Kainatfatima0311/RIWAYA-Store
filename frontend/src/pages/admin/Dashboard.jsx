import { useDashboardSnapshotQuery } from '@/api/peopleApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { PageSpinner } from '@/components/ui/Spinner';
import { formatPrice } from '@/lib/format';
import {
  ShoppingBag,
  Wallet,
  Boxes,
  AlertTriangle,
  Users,
  Truck,
  Package,
  Warehouse as WarehouseIcon,
} from 'lucide-react';

const Tile = ({ icon: Icon, label, value, sub, tone = 'default' }) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-2xl font-semibold mt-1">{value}</div>
          {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
        </div>
        <Icon className={`h-8 w-8 ${tone === 'warn' ? 'text-amber-500' : tone === 'danger' ? 'text-destructive' : 'text-primary'}`} />
      </div>
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const { data, isLoading } = useDashboardSnapshotQuery();
  if (isLoading) return <PageSpinner />;
  const d = data?.data;

  if (!d) {
    return (
      <div>
        <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
        <p className="text-muted-foreground">No data yet. Start by adding warehouses, products, and stock.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Real-time snapshot of RIWAYA operations</p>
      </div>

      {/* Today */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Today</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Tile icon={ShoppingBag} label="Orders" value={d.today.orders} />
          <Tile icon={Wallet} label="Revenue booked" value={formatPrice(d.today.revenue)} />
          <Tile icon={Wallet} label="Payments received" value={formatPrice(d.today.paymentsReceived)} sub={`${d.today.paymentCount} payments`} />
          <Tile icon={ShoppingBag} label="Pending orders" value={d.operations.pendingOrders} tone="warn" />
        </div>
      </section>

      {/* Month */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">This Month</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Tile icon={ShoppingBag} label="Orders" value={d.month.orders} />
          <Tile icon={Wallet} label="Revenue" value={formatPrice(d.month.revenue)} />
          <Tile icon={Wallet} label="Collected" value={formatPrice(d.month.paymentsReceived)} sub={`${d.month.paymentCount} payments`} />
          <Tile icon={Users} label="New customers" value={d.month.newCustomers} />
        </div>
      </section>

      {/* Inventory + Operations */}
      <section className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Inventory health</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Tile icon={AlertTriangle} label="Out of stock" value={d.inventory.outOfStock} tone="danger" />
            <Tile icon={Boxes} label="Low stock" value={d.inventory.lowStock} tone="warn" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Operations</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Tile icon={Truck} label="Shipped orders" value={d.operations.shippedOrders} />
            <Tile icon={Truck} label="Open POs" value={d.operations.openPurchaseOrders} />
          </CardContent>
        </Card>
      </section>

      {/* Catalog + People */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Tile icon={Package} label="Published products" value={d.catalog.publishedProducts} />
        <Tile icon={WarehouseIcon} label="Warehouses" value={d.catalog.warehouses} />
        <Tile icon={Users} label="Total customers" value={d.people.totalCustomers} />
        <Tile icon={Users} label="Active employees" value={d.people.activeEmployees} />
      </section>
    </div>
  );
}
