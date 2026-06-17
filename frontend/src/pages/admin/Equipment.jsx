import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import {
  useListEquipmentQuery,
  useCreateEquipmentMutation,
  useUpdateEquipmentMutation,
  useDeleteEquipmentMutation,
  useEquipmentSpendSummaryQuery,
  useListEquipmentCategoriesQuery,
  useCreateEquipmentCategoryMutation,
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
import { Card, CardContent } from '@/components/ui/Card';
import { Stagger } from '@/components/ui/Reveal';
import { CountUp } from '@/components/ui/CountUp';
import { formatPrice, formatDate } from '@/lib/format';
import { apiErrorMessage } from '@/lib/apiError';

const CONDITIONS = ['new', 'working', 'needs_repair', 'under_repair', 'retired', 'lost'];

export default function Equipment() {
  const [filters, setFilters] = useState({ search: '', category: '', condition: '' });
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  const { data, isLoading } = useListEquipmentQuery({ ...filters, page, limit: 20 });
  const { data: spend } = useEquipmentSpendSummaryQuery();
  const { data: cats } = useListEquipmentCategoriesQuery();
  const { data: warehouses } = useListWarehousesQuery({ limit: 100 });

  const [create, { isLoading: creating }] = useCreateEquipmentMutation();
  const [update, { isLoading: updating }] = useUpdateEquipmentMutation();
  const [remove, { isLoading: deleting }] = useDeleteEquipmentMutation();
  const [createCat, { isLoading: catCreating }] = useCreateEquipmentCategoryMutation();

  const handleSave = async (values) => {
    try {
      if (editing) await update({ id: editing._id, ...values }).unwrap();
      else await create(values).unwrap();
      toast.success(editing ? 'Updated' : 'Created');
      setModalOpen(false);
    } catch (err) { toast.error(apiErrorMessage(err, 'Failed')); }
  };

  const columns = [
    { key: 'name', label: 'Equipment', render: (r) => <div><div className="font-medium">{r.name}</div><div className="text-xs text-muted-foreground">{r.brand} {r.model}</div></div> },
    { key: 'category', label: 'Category', render: (r) => r.category?.name || '—' },
    { key: 'qty', label: 'Qty', render: (r) => r.quantity },
    { key: 'cost', label: 'Total cost', render: (r) => formatPrice(r.totalCost) },
    { key: 'vendor', label: 'Vendor', render: (r) => r.vendor?.name || '—' },
    { key: 'warehouse', label: 'Warehouse', render: (r) => r.warehouse?.name || '—' },
    { key: 'purchaseDate', label: 'Purchased', render: (r) => formatDate(r.purchaseDate) },
    { key: 'condition', label: 'Condition', render: (r) => <Badge variant="outline">{r.condition?.replace(/_/g, ' ')}</Badge> },
    {
      key: 'actions', label: '', className: 'text-right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => { setEditing(r); setModalOpen(true); }} className="p-1.5 hover:bg-accent/30 rounded transition-colors"><Pencil className="h-4 w-4" /></button>
          <button onClick={() => setConfirmId(r._id)} className="p-1.5 hover:bg-destructive/10 text-destructive rounded transition-colors"><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Equipment & Assets" description="Printers, laptops, fans, water coolers — admin's purchase records"
        actions={<><Button variant="outline" onClick={() => setCatModalOpen(true)}>Categories</Button><Button onClick={() => { setEditing(null); setModalOpen(true); }}><Plus className="h-4 w-4 mr-1" /> New asset</Button></>} />

      <Stagger step={80} maxDelay={400} animation="fade-up-sm" className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="hover-lift-sm"><CardContent className="pt-6"><div className="text-xs text-muted-foreground">Total records</div><div className="text-2xl font-semibold"><CountUp value={spend?.data?.totalRecords || 0} /></div></CardContent></Card>
        <Card className="hover-lift-sm"><CardContent className="pt-6"><div className="text-xs text-muted-foreground">Total items</div><div className="text-2xl font-semibold"><CountUp value={spend?.data?.totalItems || 0} /></div></CardContent></Card>
        <Card className="hover-lift-sm"><CardContent className="pt-6"><div className="text-xs text-muted-foreground">Total spend</div><div className="text-2xl font-semibold text-primary"><CountUp value={spend?.data?.totalSpent || 0} format={formatPrice} /></div></CardContent></Card>
      </Stagger>

      <FilterBar search={filters.search} onSearch={(v) => { setFilters({ ...filters, search: v }); setPage(1); }}>
        <FilterField label="Category">
          <Select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
            <option value="">All</option>
            {cats?.data?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </Select>
        </FilterField>
        <FilterField label="Condition">
          <Select value={filters.condition} onChange={(e) => setFilters({ ...filters, condition: e.target.value })}>
            <option value="">All</option>
            {CONDITIONS.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
          </Select>
        </FilterField>
      </FilterBar>

      <DataTable columns={columns} data={data?.data || []} loading={isLoading} pagination={data?.pagination} onPageChange={setPage} />

      <EquipmentFormModal open={modalOpen} onClose={() => setModalOpen(false)} initial={editing} categories={cats?.data || []} warehouses={warehouses?.data || []} onSubmit={handleSave} loading={creating || updating} />

      <Modal open={catModalOpen} onClose={() => setCatModalOpen(false)} title="Equipment categories">
        <CategoriesQuickList categories={cats?.data || []} onCreate={async (name) => { try { await createCat({ name }).unwrap(); toast.success('Category created'); } catch (e) { toast.error(apiErrorMessage(e, 'Failed')); } }} loading={catCreating} />
      </Modal>

      <ConfirmDialog open={!!confirmId} onClose={() => setConfirmId(null)} title="Delete asset?"
        onConfirm={async () => { try { await remove(confirmId).unwrap(); toast.success('Deleted'); setConfirmId(null); } catch (err) { toast.error(apiErrorMessage(err, 'Failed')); } }} loading={deleting} />
    </div>
  );
}

function EquipmentFormModal({ open, onClose, initial, categories, warehouses, onSubmit, loading }) {
  const { register, handleSubmit } = useForm({
    values: initial ? {
      name: initial.name, brand: initial.brand, model: initial.model, serialNumber: initial.serialNumber,
      category: initial.category?._id || '', warehouse: initial.warehouse?._id || '',
      quantity: initial.quantity, unitCost: initial.unitCost,
      purchaseDate: initial.purchaseDate?.slice(0, 10), warrantyMonths: initial.warrantyMonths,
      condition: initial.condition, vendorName: initial.vendor?.name, vendorPhone: initial.vendor?.phone,
      invoiceNumber: initial.invoiceNumber, notes: initial.notes,
    } : { name: '', brand: '', model: '', serialNumber: '', category: '', warehouse: '', quantity: 1, unitCost: '', purchaseDate: new Date().toISOString().slice(0, 10), warrantyMonths: 0, condition: 'new', vendorName: '', vendorPhone: '', invoiceNumber: '', notes: '' },
  });

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit asset' : 'New asset'} size="lg"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={handleSubmit((v) => onSubmit({
        name: v.name, brand: v.brand || undefined, model: v.model || undefined, serialNumber: v.serialNumber || undefined,
        category: v.category, warehouse: v.warehouse, quantity: Number(v.quantity), unitCost: Number(v.unitCost),
        purchaseDate: v.purchaseDate, warrantyMonths: v.warrantyMonths ? Number(v.warrantyMonths) : 0,
        condition: v.condition, vendor: { name: v.vendorName, phone: v.vendorPhone },
        invoiceNumber: v.invoiceNumber || undefined, notes: v.notes || undefined,
      }))} loading={loading}>{initial ? 'Save' : 'Create'}</Button></>}>
      <form className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2"><Label required>Name</Label><Input {...register('name', { required: true })} placeholder="HP LaserJet Pro M1136" /></div>
        <div><Label>Brand</Label><Input {...register('brand')} /></div>
        <div><Label>Model</Label><Input {...register('model')} /></div>
        <div><Label>Serial #</Label><Input {...register('serialNumber')} /></div>
        <div><Label required>Category</Label><Select {...register('category', { required: true })}><option value="">Choose…</option>{categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</Select></div>
        <div><Label required>Warehouse</Label><Select {...register('warehouse', { required: true })}><option value="">Choose…</option>{warehouses.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}</Select></div>
        <div><Label>Condition</Label><Select {...register('condition')}>{CONDITIONS.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}</Select></div>
        <div><Label required>Quantity</Label><Input type="number" {...register('quantity', { required: true })} /></div>
        <div><Label required>Unit cost (Rs)</Label><Input type="number" {...register('unitCost', { required: true })} /></div>
        <div><Label required>Purchase date</Label><Input type="date" {...register('purchaseDate', { required: true })} /></div>
        <div><Label>Warranty (months)</Label><Input type="number" {...register('warrantyMonths')} /></div>
        <div><Label>Vendor name</Label><Input {...register('vendorName')} /></div>
        <div><Label>Vendor phone</Label><Input {...register('vendorPhone')} /></div>
        <div className="sm:col-span-2"><Label>Invoice number</Label><Input {...register('invoiceNumber')} /></div>
        <div className="sm:col-span-2"><Label>Notes</Label><Textarea rows={2} {...register('notes')} /></div>
      </form>
    </Modal>
  );
}

function CategoriesQuickList({ categories, onCreate, loading }) {
  const [name, setName] = useState('');
  return (
    <div>
      <div className="flex gap-2 mb-3">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New category name" />
        <Button onClick={async () => { if (name) { await onCreate(name); setName(''); } }} loading={loading}>Add</Button>
      </div>
      <ul className="space-y-1 text-sm">
        {categories.map((c) => <li key={c._id} className="py-1.5 px-2 border-b last:border-0">{c.name}</li>)}
      </ul>
    </div>
  );
}
