import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Eye, Trash2, ChevronRight, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import {
  useListPOsQuery,
  useCreatePOMutation,
  useDeletePOMutation,
  useListSuppliersQuery,
} from '@/api/inventoryApi';
import { useListWarehousesQuery } from '@/api/warehouseApi';
import { PageHeader } from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { FilterBar, FilterField } from '@/components/admin/FilterBar';
import { Modal } from '@/components/admin/Modal';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { formatPrice, formatDate } from '@/lib/format';
import { apiErrorMessage } from '@/lib/apiError';

const STATUSES = ['draft', 'placed', 'partially_received', 'fully_received', 'cancelled'];

export default function PurchaseOrders() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  const { data, isLoading } = useListPOsQuery({ ...filters, page, limit: 20 });
  const { data: suppliers } = useListSuppliersQuery({ limit: 200 });
  const { data: warehouses } = useListWarehousesQuery({ limit: 50 });
  const [create, { isLoading: creating }] = useCreatePOMutation();
  const [remove, { isLoading: deleting }] = useDeletePOMutation();

  const columns = [
    { key: 'poNumber', label: 'PO Number', render: (r) => <span className="font-mono font-medium text-primary">{r.poNumber}</span> },
    { key: 'supplier', label: 'Supplier', render: (r) => r.supplier?.name || '—' },
    { key: 'warehouse', label: 'To', render: (r) => r.warehouse?.name || '—' },
    { key: 'date', label: 'Date', render: (r) => formatDate(r.orderDate) },
    { key: 'total', label: 'Total', render: (r) => formatPrice(r.grandTotal) },
    { key: 'paid', label: 'Paid', render: (r) => `${formatPrice(r.paidAmount)} / ${formatPrice(r.grandTotal)}` },
    { key: 'status', label: 'Status', render: (r) => <Badge status={r.status}>{r.status.replace(/_/g, ' ')}</Badge> },
    { key: 'pay', label: 'Payment', render: (r) => <Badge status={r.paymentStatus}>{r.paymentStatus.replace(/_/g, ' ')}</Badge> },
    {
      key: 'actions', label: '', className: 'text-right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button aria-label="View purchase order" onClick={() => navigate(`/admin/purchase-orders/${r._id}`)} className="p-1.5 hover:bg-accent/30 rounded transition-colors"><Eye className="h-4 w-4" /></button>
          {r.status === 'draft' && <button aria-label="Delete purchase order" onClick={() => setConfirmId(r._id)} className="p-1.5 hover:bg-destructive/10 text-destructive rounded transition-colors"><Trash2 className="h-4 w-4" /></button>}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="animate-fade-up">
        <PageHeader title="Purchase Orders" description="Orders to mills with partial receiving and payment tracking"
          actions={<Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4 mr-1" /> New PO</Button>} />
      </div>

      <FilterBar search={filters.search} onSearch={(v) => { setFilters({ ...filters, search: v }); setPage(1); }} placeholder="Search PO number">
        <FilterField label="Status">
          <Select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </Select>
        </FilterField>
      </FilterBar>

      <DataTable columns={columns} data={data?.data || []} loading={isLoading} pagination={data?.pagination} onPageChange={setPage} onRowClick={(r) => navigate(`/admin/purchase-orders/${r._id}`)} />

      <POFormModal open={modalOpen} onClose={() => setModalOpen(false)} suppliers={suppliers?.data || []} warehouses={warehouses?.data || []}
        onSubmit={async (values) => { try { const res = await create(values).unwrap(); toast.success('PO drafted'); setModalOpen(false); navigate(`/admin/purchase-orders/${res.data._id}`); } catch (err) { toast.error(apiErrorMessage(err, 'Failed')); } }} loading={creating} />

      <ConfirmDialog open={!!confirmId} onClose={() => setConfirmId(null)} title="Delete PO?" description="Only draft POs can be deleted."
        onConfirm={async () => { try { await remove(confirmId).unwrap(); toast.success('Deleted'); setConfirmId(null); } catch (err) { toast.error(apiErrorMessage(err, 'Failed')); } }} loading={deleting} />
    </div>
  );
}

function POFormModal({ open, onClose, suppliers, warehouses, onSubmit, loading }) {
  const { register, handleSubmit } = useForm({
    defaultValues: {
      supplier: '', warehouse: '', expectedDeliveryDate: '',
      taxRate: 0, shippingCost: 0, discount: 0, notes: '',
      itemName: '', itemQty: 1, itemPrice: 0, itemUnit: 'pcs',
    },
  });

  return (
    <Modal open={open} onClose={onClose} title="New purchase order" size="lg"
      description="Create a draft. Add more items and approve from the detail page."
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={handleSubmit((v) => onSubmit({
        supplier: v.supplier, warehouse: v.warehouse,
        expectedDeliveryDate: v.expectedDeliveryDate || undefined,
        taxRate: Number(v.taxRate) || 0,
        shippingCost: Number(v.shippingCost) || 0,
        discount: Number(v.discount) || 0,
        notes: v.notes,
        items: [{ name: v.itemName, quantityOrdered: Number(v.itemQty), unitPrice: Number(v.itemPrice), unit: v.itemUnit }],
      }))} loading={loading}>Create draft</Button></>}>
      <form className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><Label required>Supplier</Label><Select {...register('supplier', { required: true })}><option value="">Choose…</option>{suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}</Select></div>
        <div><Label required>Warehouse</Label><Select {...register('warehouse', { required: true })}><option value="">Choose…</option>{warehouses.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}</Select></div>
        <div className="sm:col-span-2"><Label>Expected delivery</Label><Input type="date" {...register('expectedDeliveryDate')} /></div>

        <div className="sm:col-span-2 mt-2"><div className="text-sm font-medium mb-1">First item</div></div>
        <div className="sm:col-span-2"><Label required>Item name</Label><Input {...register('itemName', { required: true })} placeholder="Embroidered Bridal Suit" /></div>
        <div><Label>Quantity</Label><Input type="number" {...register('itemQty')} /></div>
        <div><Label>Unit price (Rs)</Label><Input type="number" {...register('itemPrice')} /></div>
        <div><Label>Unit</Label><Select {...register('itemUnit')}>{['pcs','mtr','kg','dozens','suits'].map((u) => <option key={u} value={u}>{u}</option>)}</Select></div>

        <div className="sm:col-span-2 mt-2"><div className="text-sm font-medium mb-1">Charges</div></div>
        <div><Label>Tax rate (%)</Label><Input type="number" {...register('taxRate')} /></div>
        <div><Label>Shipping cost (Rs)</Label><Input type="number" {...register('shippingCost')} /></div>
        <div><Label>Discount (Rs)</Label><Input type="number" {...register('discount')} /></div>
        <div className="sm:col-span-2"><Label>Notes</Label><Textarea rows={2} {...register('notes')} /></div>
      </form>
    </Modal>
  );
}
