import { useState } from 'react';
import { Plus, Pencil, Trash2, ArrowDownToLine, ArrowUpDown, MinusCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import {
  useListStockItemsQuery,
  useCreateStockItemMutation,
  useUpdateStockItemMutation,
  useDeleteStockItemMutation,
  useReceiveStockMutation,
  useTransferStockMutation,
  useAdjustStockMutation,
  useWriteOffStockMutation,
  useLowStockQuery,
  useListSuppliersQuery,
} from '@/api/inventoryApi';
import { useListRacksQuery, useListRackCategoriesQuery } from '@/api/warehouseApi';
import { PageHeader } from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { FilterBar, FilterField } from '@/components/admin/FilterBar';
import { Modal } from '@/components/admin/Modal';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { Stagger } from '@/components/ui/Reveal';
import { CountUp } from '@/components/ui/CountUp';
import { formatPrice } from '@/lib/format';
import { apiErrorMessage } from '@/lib/apiError';

export default function Stock() {
  const [filters, setFilters] = useState({ search: '', stockStatus: '' });
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [opModal, setOpModal] = useState(null); // { type, item }

  const { data, isLoading } = useListStockItemsQuery({ ...filters, page, limit: 20 });
  const { data: lowData } = useLowStockQuery();
  const { data: racks } = useListRacksQuery({ limit: 200 });
  const { data: rackCats } = useListRackCategoriesQuery();
  const { data: suppliers } = useListSuppliersQuery({ limit: 200 });

  const [create, { isLoading: creating }] = useCreateStockItemMutation();
  const [update, { isLoading: updating }] = useUpdateStockItemMutation();
  const [remove, { isLoading: deleting }] = useDeleteStockItemMutation();
  const [receive] = useReceiveStockMutation();
  const [transfer] = useTransferStockMutation();
  const [adjust] = useAdjustStockMutation();
  const [writeOff] = useWriteOffStockMutation();

  const lowCounts = lowData?.data?.counts || { out_of_stock: 0, urgent: 0, low: 0 };

  const handleSave = async (values) => {
    try {
      if (editing) await update({ id: editing._id, ...values }).unwrap();
      else await create(values).unwrap();
      toast.success(editing ? 'Updated' : 'Created');
      setModalOpen(false);
    } catch (err) { toast.error(apiErrorMessage(err, 'Failed')); }
  };

  const columns = [
    { key: 'name', label: 'Item', render: (r) => <div><div className="font-medium">{r.name}</div><div className="text-xs text-muted-foreground font-mono">{r.sku}</div></div> },
    { key: 'category', label: 'Rack cat.', render: (r) => r.rackCategory?.name || '—' },
    { key: 'qty', label: 'Quantity', render: (r) => <div>
      <div className="font-semibold">{r.totalQuantity || 0}</div>
      {r.reservedQuantity > 0 && <div className="text-xs text-amber-600">{r.reservedQuantity} reserved</div>}
    </div> },
    { key: 'cost', label: 'Unit cost', render: (r) => formatPrice(r.unitCost) },
    { key: 'value', label: 'Stock value', render: (r) => formatPrice((r.totalQuantity || 0) * (r.unitCost || 0)) },
    { key: 'status', label: 'Status', render: (r) => <Badge status={r.stockStatus}>{r.stockStatus?.replace(/_/g, ' ')}</Badge> },
    {
      key: 'actions', label: '', className: 'text-right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => setOpModal({ type: 'receive', item: r })} title="Receive" className="p-1.5 hover:bg-accent/30 rounded transition-colors"><ArrowDownToLine className="h-4 w-4 text-emerald-600" /></button>
          <button onClick={() => setOpModal({ type: 'transfer', item: r })} title="Transfer" className="p-1.5 hover:bg-accent/30 rounded transition-colors"><ArrowUpDown className="h-4 w-4 text-blue-600" /></button>
          <button onClick={() => setOpModal({ type: 'adjust', item: r })} title="Adjust" className="p-1.5 hover:bg-accent/30 rounded transition-colors"><Pencil className="h-4 w-4" /></button>
          <button onClick={() => setOpModal({ type: 'writeOff', item: r })} title="Write off" className="p-1.5 hover:bg-destructive/10 text-destructive rounded transition-colors"><MinusCircle className="h-4 w-4" /></button>
          <button onClick={() => { setEditing(r); setModalOpen(true); }} className="p-1.5 hover:bg-accent/30 rounded transition-colors"><Pencil className="h-4 w-4 text-muted-foreground" /></button>
          <button onClick={() => setConfirmId(r._id)} className="p-1.5 hover:bg-destructive/10 text-destructive rounded transition-colors"><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Stock Items" description="Inventory master list with per-rack quantities & low-stock alerts"
        actions={<Button onClick={() => { setEditing(null); setModalOpen(true); }}><Plus className="h-4 w-4 mr-1" /> New stock item</Button>} />

      <Stagger step={80} maxDelay={400} animation="fade-up-sm" className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="hover-lift-sm"><CardContent className="pt-6"><div className="flex items-center justify-between"><div><div className="text-xs text-muted-foreground">Out of stock</div><div className="text-2xl font-semibold text-destructive"><CountUp value={lowCounts.out_of_stock} /></div></div><AlertTriangle className="h-8 w-8 text-destructive" /></div></CardContent></Card>
        <Card className="hover-lift-sm"><CardContent className="pt-6"><div className="flex items-center justify-between"><div><div className="text-xs text-muted-foreground">Urgent (≤ reorder)</div><div className="text-2xl font-semibold text-amber-600"><CountUp value={lowCounts.urgent} /></div></div><AlertTriangle className="h-8 w-8 text-amber-500" /></div></CardContent></Card>
        <Card className="hover-lift-sm"><CardContent className="pt-6"><div className="flex items-center justify-between"><div><div className="text-xs text-muted-foreground">Low</div><div className="text-2xl font-semibold text-amber-700"><CountUp value={lowCounts.low} /></div></div><AlertTriangle className="h-8 w-8 text-amber-600" /></div></CardContent></Card>
      </Stagger>

      <FilterBar search={filters.search} onSearch={(v) => { setFilters({ ...filters, search: v }); setPage(1); }}>
        <FilterField label="Stock status">
          <Select value={filters.stockStatus} onChange={(e) => setFilters({ ...filters, stockStatus: e.target.value })}>
            <option value="">All</option>
            <option value="out_of_stock">Out of stock</option>
            <option value="urgent">Urgent</option>
            <option value="low">Low</option>
            <option value="ok">OK</option>
          </Select>
        </FilterField>
      </FilterBar>

      <DataTable columns={columns} data={data?.data || []} loading={isLoading} pagination={data?.pagination} onPageChange={setPage} />

      <StockItemFormModal open={modalOpen} onClose={() => setModalOpen(false)} initial={editing} suppliers={suppliers?.data || []} rackCategories={rackCats?.data || []} onSubmit={handleSave} loading={creating || updating} />

      <StockOpModal op={opModal} onClose={() => setOpModal(null)} racks={racks?.data || []} onReceive={async (v) => { try { await receive(v).unwrap(); toast.success('Stock received'); setOpModal(null); } catch (e) { toast.error(apiErrorMessage(e, 'Failed')); } }} onTransfer={async (v) => { try { await transfer(v).unwrap(); toast.success('Stock transferred'); setOpModal(null); } catch (e) { toast.error(apiErrorMessage(e, 'Failed')); } }} onAdjust={async (v) => { try { await adjust(v).unwrap(); toast.success('Adjusted'); setOpModal(null); } catch (e) { toast.error(apiErrorMessage(e, 'Failed')); } }} onWriteOff={async (v) => { try { await writeOff(v).unwrap(); toast.success('Written off'); setOpModal(null); } catch (e) { toast.error(apiErrorMessage(e, 'Failed')); } }} />

      <ConfirmDialog open={!!confirmId} onClose={() => setConfirmId(null)} title="Delete stock item?"
        onConfirm={async () => { try { await remove(confirmId).unwrap(); toast.success('Deleted'); setConfirmId(null); } catch (err) { toast.error(apiErrorMessage(err, 'Failed')); } }} loading={deleting} />
    </div>
  );
}

function StockItemFormModal({ open, onClose, initial, suppliers, rackCategories, onSubmit, loading }) {
  const { register, handleSubmit } = useForm({
    values: initial ? {
      name: initial.name, sku: initial.sku, description: initial.description || '',
      rackCategory: initial.rackCategory?._id || initial.rackCategory || '',
      supplier: initial.supplier?._id || initial.supplier || '',
      unit: initial.unit || 'pcs', unitCost: initial.unitCost || 0,
      minStockLevel: initial.minStockLevel || 10, reorderLevel: initial.reorderLevel || 5,
    } : { name: '', sku: '', description: '', rackCategory: '', supplier: '', unit: 'pcs', unitCost: 0, minStockLevel: 10, reorderLevel: 5 },
  });

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit stock item' : 'New stock item'} size="lg"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={handleSubmit((v) => onSubmit({ ...v, rackCategory: v.rackCategory || undefined, supplier: v.supplier || undefined, unitCost: Number(v.unitCost), minStockLevel: Number(v.minStockLevel), reorderLevel: Number(v.reorderLevel) }))} loading={loading}>{initial ? 'Save' : 'Create'}</Button></>}>
      <form className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2"><Label required>Name</Label><Input {...register('name', { required: true })} /></div>
        <div><Label>SKU (auto if blank)</Label><Input {...register('sku')} placeholder="SKU-00001" /></div>
        <div><Label>Unit</Label><Select {...register('unit')}>{['pcs','mtr','kg','dozens','suits'].map((u) => <option key={u} value={u}>{u}</option>)}</Select></div>
        <div><Label>Rack category</Label><Select {...register('rackCategory')}><option value="">—</option>{rackCategories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</Select></div>
        <div><Label>Supplier</Label><Select {...register('supplier')}><option value="">—</option>{suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}</Select></div>
        <div><Label>Unit cost (Rs)</Label><Input type="number" {...register('unitCost')} /></div>
        <div><Label>Min stock level</Label><Input type="number" {...register('minStockLevel')} /></div>
        <div><Label>Reorder level</Label><Input type="number" {...register('reorderLevel')} /></div>
        <div className="sm:col-span-2"><Label>Description</Label><Textarea rows={2} {...register('description')} /></div>
      </form>
    </Modal>
  );
}

function StockOpModal({ op, onClose, racks, onReceive, onTransfer, onAdjust, onWriteOff }) {
  const { register, handleSubmit, reset } = useForm();
  if (!op) return null;
  const { type, item } = op;

  const titles = { receive: 'Receive stock', transfer: 'Transfer stock', adjust: 'Adjust stock', writeOff: 'Write off stock' };

  const submit = (v) => {
    const payload = { id: item._id };
    if (type === 'receive') return onReceive({ ...payload, rack: v.rack, quantity: Number(v.quantity), unitCost: v.unitCost ? Number(v.unitCost) : undefined, reason: v.reason });
    if (type === 'transfer') return onTransfer({ ...payload, fromRack: v.fromRack, toRack: v.toRack, quantity: Number(v.quantity), reason: v.reason });
    if (type === 'adjust') return onAdjust({ ...payload, rack: v.rack, delta: Number(v.delta), reason: v.reason });
    if (type === 'writeOff') return onWriteOff({ ...payload, rack: v.rack, quantity: Number(v.quantity), reason: v.reason });
  };

  return (
    <Modal open onClose={onClose} title={titles[type]} description={`${item.name} (${item.sku})`}
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={handleSubmit(submit)}>Confirm</Button></>}>
      <form className="space-y-3">
        {type === 'transfer' ? (
          <>
            <div><Label required>From rack</Label><Select {...register('fromRack', { required: true })}><option value="">Choose…</option>{racks.map((r) => <option key={r._id} value={r._id}>{r.code} — {r.warehouse?.name}</option>)}</Select></div>
            <div><Label required>To rack</Label><Select {...register('toRack', { required: true })}><option value="">Choose…</option>{racks.map((r) => <option key={r._id} value={r._id}>{r.code} — {r.warehouse?.name}</option>)}</Select></div>
            <div><Label required>Quantity</Label><Input type="number" {...register('quantity', { required: true })} /></div>
          </>
        ) : (
          <>
            <div><Label required>Rack</Label><Select {...register('rack', { required: true })}><option value="">Choose…</option>{racks.map((r) => <option key={r._id} value={r._id}>{r.code} — {r.warehouse?.name}</option>)}</Select></div>
            {type === 'adjust' ? (
              <div><Label required>Delta (positive or negative)</Label><Input type="number" {...register('delta', { required: true })} placeholder="e.g. 5 or -3" /></div>
            ) : (
              <div><Label required>Quantity</Label><Input type="number" {...register('quantity', { required: true })} /></div>
            )}
            {type === 'receive' && <div><Label>Unit cost (Rs, optional)</Label><Input type="number" {...register('unitCost')} /></div>}
          </>
        )}
        <div><Label required={['adjust','writeOff'].includes(type)}>Reason</Label><Textarea rows={2} {...register('reason')} /></div>
      </form>
    </Modal>
  );
}
