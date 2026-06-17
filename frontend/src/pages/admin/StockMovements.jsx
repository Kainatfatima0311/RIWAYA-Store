import { useState } from 'react';
import { useListStockMovementsQuery } from '@/api/inventoryApi';
import { PageHeader } from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { FilterBar, FilterField } from '@/components/admin/FilterBar';
import { Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { formatDateTime } from '@/lib/format';
import { ArrowDownToLine, ArrowUpRight, ArrowDownLeft, MinusCircle, ShoppingBag, RotateCcw } from 'lucide-react';

const TYPE_ICONS = {
  receive: { icon: ArrowDownToLine, color: 'text-emerald-600' },
  transfer_in: { icon: ArrowDownLeft, color: 'text-blue-600' },
  transfer_out: { icon: ArrowUpRight, color: 'text-blue-600' },
  sale: { icon: ShoppingBag, color: 'text-primary' },
  return: { icon: RotateCcw, color: 'text-amber-600' },
  adjust_in: { icon: ArrowDownToLine, color: 'text-emerald-600' },
  adjust_out: { icon: ArrowUpRight, color: 'text-destructive' },
  write_off: { icon: MinusCircle, color: 'text-destructive' },
  reserve: { icon: ArrowUpRight, color: 'text-amber-600' },
  unreserve: { icon: ArrowDownLeft, color: 'text-muted-foreground' },
};

export default function StockMovements() {
  const [filters, setFilters] = useState({ type: '' });
  const [page, setPage] = useState(1);
  const { data, isLoading } = useListStockMovementsQuery({ ...filters, page, limit: 50 });

  const columns = [
    { key: 'when', label: 'When', render: (r) => formatDateTime(r.performedAt) },
    { key: 'type', label: 'Type', render: (r) => {
      const T = TYPE_ICONS[r.type] || TYPE_ICONS.receive;
      return <div className="inline-flex items-center gap-1.5"><T.icon className={`h-4 w-4 ${T.color}`} /> <span className="capitalize">{r.type.replace(/_/g, ' ')}</span></div>;
    } },
    { key: 'item', label: 'Item', render: (r) => <div><div className="font-medium">{r.stockItem?.name || r.stockItemName}</div><div className="text-xs text-muted-foreground font-mono">{r.stockItem?.sku || r.stockItemSku}</div></div> },
    { key: 'qty', label: 'Qty', render: (r) => <span className={r.quantity > 0 ? 'text-emerald-600 font-medium' : 'text-destructive font-medium'}>{r.quantity > 0 ? '+' : ''}{r.quantity}</span> },
    { key: 'rack', label: 'Rack', render: (r) => r.toRack?.code || r.fromRack?.code || '—' },
    { key: 'ref', label: 'Ref', render: (r) => r.reference?.label || (r.reference?.kind ? r.reference.kind : '—') },
    { key: 'by', label: 'By', render: (r) => r.performedBy?.name || '—' },
    { key: 'reason', label: 'Reason', render: (r) => <span className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">{r.reason || '—'}</span> },
  ];

  return (
    <div>
      <PageHeader title="Stock Movements" description="Full audit log of every inventory change" />

      <FilterBar>
        <FilterField label="Movement type">
          <Select value={filters.type} onChange={(e) => { setFilters({ type: e.target.value }); setPage(1); }}>
            <option value="">All types</option>
            {Object.keys(TYPE_ICONS).map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </Select>
        </FilterField>
      </FilterBar>

      <DataTable columns={columns} data={data?.data || []} loading={isLoading} pagination={data?.pagination} onPageChange={setPage} />
    </div>
  );
}
