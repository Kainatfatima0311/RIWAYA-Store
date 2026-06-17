import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { useListOrdersQuery, useOrderStatsQuery } from '@/api/orderApi';
import { PageHeader } from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { FilterBar, FilterField } from '@/components/admin/FilterBar';
import { Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { Stagger } from '@/components/ui/Reveal';
import { CountUp } from '@/components/ui/CountUp';
import { formatPrice, formatDate } from '@/lib/format';

const STATUSES = ['pending','confirmed','packed','shipped','out_for_delivery','delivered','cancelled','returned','refunded'];

export default function Orders() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ search: '', orderType: '', status: '', paymentStatus: '' });
  const [page, setPage] = useState(1);
  const { data, isLoading } = useListOrdersQuery({ ...filters, page, limit: 20 });
  const { data: stats } = useOrderStatsQuery();

  const summary = stats?.data?.summary || { totalOrders: 0, totalRevenue: 0, totalPaid: 0, totalRefunded: 0 };

  const columns = [
    { key: 'orderNumber', label: 'Order #', render: (r) => <span className="font-mono font-medium text-primary">{r.orderNumber}</span> },
    { key: 'customer', label: 'Customer', render: (r) => <div><div className="font-medium">{r.customer?.name}</div><div className="text-xs text-muted-foreground">{r.customer?.phone}</div></div> },
    { key: 'type', label: 'Type', render: (r) => <Badge variant="outline">{r.orderType}</Badge> },
    { key: 'total', label: 'Total', render: (r) => formatPrice(r.grandTotal) },
    { key: 'status', label: 'Status', render: (r) => <Badge status={r.status}>{r.status.replace(/_/g, ' ')}</Badge> },
    { key: 'pay', label: 'Payment', render: (r) => <Badge status={r.paymentStatus}>{r.paymentStatus.replace(/_/g, ' ')}</Badge> },
    { key: 'date', label: 'Date', render: (r) => formatDate(r.orderedAt) },
    {
      key: 'actions', label: '', className: 'text-right',
      render: (r) => (
        <button aria-label="View order" onClick={(e) => { e.stopPropagation(); navigate(`/admin/orders/${r._id}`); }} className="p-1.5 hover:bg-accent/30 rounded transition-colors">
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Orders" description="All customer orders (online + walk-in)" />

      <Stagger step={70} maxDelay={400} animation="fade-up-sm" className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="hover-lift-sm"><CardContent className="pt-6"><div className="text-xs text-muted-foreground">Total orders</div><div className="text-2xl font-semibold"><CountUp value={summary.totalOrders} /></div></CardContent></Card>
        <Card className="hover-lift-sm"><CardContent className="pt-6"><div className="text-xs text-muted-foreground">Revenue</div><div className="text-2xl font-semibold text-primary"><CountUp value={summary.totalRevenue} format={formatPrice} /></div></CardContent></Card>
        <Card className="hover-lift-sm"><CardContent className="pt-6"><div className="text-xs text-muted-foreground">Collected</div><div className="text-2xl font-semibold text-emerald-600"><CountUp value={summary.totalPaid} format={formatPrice} /></div></CardContent></Card>
        <Card className="hover-lift-sm"><CardContent className="pt-6"><div className="text-xs text-muted-foreground">Refunded</div><div className="text-2xl font-semibold text-destructive"><CountUp value={summary.totalRefunded} format={formatPrice} /></div></CardContent></Card>
      </Stagger>

      <FilterBar search={filters.search} onSearch={(v) => { setFilters({ ...filters, search: v }); setPage(1); }} placeholder="Search order number">
        <FilterField label="Type">
          <Select value={filters.orderType} onChange={(e) => setFilters({ ...filters, orderType: e.target.value })}>
            <option value="">All</option>
            <option value="online">Online</option>
            <option value="physical">Physical / walk-in</option>
          </Select>
        </FilterField>
        <FilterField label="Status">
          <Select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </Select>
        </FilterField>
        <FilterField label="Payment">
          <Select value={filters.paymentStatus} onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}>
            <option value="">All</option>
            {['unpaid', 'partial', 'paid', 'partially_refunded', 'refunded'].map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </Select>
        </FilterField>
      </FilterBar>

      <DataTable columns={columns} data={data?.data || []} loading={isLoading} pagination={data?.pagination} onPageChange={setPage} onRowClick={(r) => navigate(`/admin/orders/${r._id}`)} />
    </div>
  );
}
