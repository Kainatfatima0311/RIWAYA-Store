import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import {
  useListCustomersQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
} from '@/api/peopleApi';
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

export default function Customers() {
  const [filters, setFilters] = useState({ search: '', customerType: '', segment: '' });
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  const { data, isLoading } = useListCustomersQuery({ ...filters, page, limit: 20 });
  const [create, { isLoading: creating }] = useCreateCustomerMutation();
  const [update, { isLoading: updating }] = useUpdateCustomerMutation();
  const [remove, { isLoading: deleting }] = useDeleteCustomerMutation();

  const handleSave = async (values) => {
    try {
      if (editing) await update({ id: editing._id, ...values }).unwrap();
      else await create(values).unwrap();
      toast.success(editing ? 'Updated' : 'Created');
      setModalOpen(false);
    } catch (err) { toast.error(err?.data?.message || 'Failed'); }
  };

  const columns = [
    { key: 'name', label: 'Customer', render: (r) => <div><div className="font-medium">{r.name}</div><div className="text-xs text-muted-foreground font-mono">{r.customerCode}</div></div> },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email', render: (r) => r.email || '—' },
    { key: 'type', label: 'Type', render: (r) => <Badge variant="outline">{r.customerType === 'walk_in' ? 'Walk-in' : 'Online'}</Badge> },
    { key: 'segment', label: 'Segment', render: (r) => <Badge>{r.segment}</Badge> },
    { key: 'orders', label: 'Orders', render: (r) => r.totalOrders || 0 },
    { key: 'spent', label: 'Total spent', render: (r) => formatPrice(r.totalSpent) },
    { key: 'lastOrder', label: 'Last order', render: (r) => r.lastOrderAt ? formatDate(r.lastOrderAt) : '—' },
    {
      key: 'actions', label: '', className: 'text-right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => { setEditing(r); setModalOpen(true); }} className="p-1.5 hover:bg-accent/30 rounded"><Pencil className="h-4 w-4" /></button>
          <button onClick={() => setConfirmId(r._id)} className="p-1.5 hover:bg-destructive/10 text-destructive rounded"><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Customers" description="Online & walk-in customers"
        actions={<Button onClick={() => { setEditing(null); setModalOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add walk-in</Button>} />

      <FilterBar search={filters.search} onSearch={(v) => { setFilters({ ...filters, search: v }); setPage(1); }} placeholder="Search by name, phone, email, code">
        <FilterField label="Type">
          <Select value={filters.customerType} onChange={(e) => { setFilters({ ...filters, customerType: e.target.value }); setPage(1); }}>
            <option value="">All types</option>
            <option value="online">Online</option>
            <option value="walk_in">Walk-in</option>
          </Select>
        </FilterField>
        <FilterField label="Segment">
          <Select value={filters.segment} onChange={(e) => { setFilters({ ...filters, segment: e.target.value }); setPage(1); }}>
            <option value="">All</option>
            {['new', 'returning', 'vip', 'inactive', 'blocked'].map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </FilterField>
      </FilterBar>

      <DataTable columns={columns} data={data?.data || []} loading={isLoading} pagination={data?.pagination} onPageChange={setPage} />

      <CustomerFormModal open={modalOpen} onClose={() => setModalOpen(false)} initial={editing} onSubmit={handleSave} loading={creating || updating} />
      <ConfirmDialog open={!!confirmId} onClose={() => setConfirmId(null)} title="Delete customer?"
        onConfirm={async () => { try { await remove(confirmId).unwrap(); toast.success('Deleted'); setConfirmId(null); } catch (err) { toast.error(err?.data?.message || 'Cannot delete'); } }} loading={deleting} />
    </div>
  );
}

function CustomerFormModal({ open, onClose, initial, onSubmit, loading }) {
  const { register, handleSubmit } = useForm({
    values: initial ? {
      name: initial.name, phone: initial.phone, email: initial.email || '',
      cnic: initial.cnic || '', source: initial.source || '',
      preferredLanguage: initial.preferredLanguage || 'en', notes: initial.notes || '',
    } : { name: '', phone: '', email: '', cnic: '', source: 'walk_in', preferredLanguage: 'en', notes: '' },
  });

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit customer' : 'New walk-in customer'}
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={handleSubmit(onSubmit)} loading={loading}>{initial ? 'Save' : 'Create'}</Button></>}>
      <form className="space-y-3">
        <div><Label required>Name</Label><Input {...register('name', { required: true })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label required>Phone</Label><Input {...register('phone', { required: true })} placeholder="+92 300 1234567" /></div>
          <div><Label>Email</Label><Input type="email" {...register('email')} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>CNIC</Label><Input {...register('cnic')} placeholder="00000-0000000-0" /></div>
          <div><Label>Source</Label><Input {...register('source')} placeholder="walk-in, facebook…" /></div>
        </div>
        <div><Label>Language</Label><Select {...register('preferredLanguage')}><option value="en">English</option><option value="ur">Urdu</option></Select></div>
        <div><Label>Notes</Label><Textarea rows={2} {...register('notes')} /></div>
      </form>
    </Modal>
  );
}
