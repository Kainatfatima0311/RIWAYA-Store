import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import {
  useListSuppliersQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
} from '@/api/inventoryApi';
import { PageHeader } from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { FilterBar } from '@/components/admin/FilterBar';
import { Modal } from '@/components/admin/Modal';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { formatPrice } from '@/lib/format';
import { apiErrorMessage } from '@/lib/apiError';

export default function Suppliers() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  const { data, isLoading } = useListSuppliersQuery({ search, page, limit: 20 });
  const [create, { isLoading: creating }] = useCreateSupplierMutation();
  const [update, { isLoading: updating }] = useUpdateSupplierMutation();
  const [remove, { isLoading: deleting }] = useDeleteSupplierMutation();

  const handleSave = async (values) => {
    try {
      if (editing) await update({ id: editing._id, ...values }).unwrap();
      else await create(values).unwrap();
      toast.success(editing ? 'Updated' : 'Created');
      setModalOpen(false);
    } catch (err) { toast.error(apiErrorMessage(err, 'Failed to save supplier')); }
  };

  const columns = [
    { key: 'name', label: 'Supplier', render: (r) => <div><div className="font-medium">{r.name}</div><div className="text-xs text-muted-foreground font-mono">{r.code}</div></div> },
    { key: 'type', label: 'Type', render: (r) => <Badge variant="outline">{r.type}</Badge> },
    { key: 'phone', label: 'Phone' },
    { key: 'city', label: 'City', render: (r) => r.address?.city || '—' },
    { key: 'spent', label: 'Total purchases', render: (r) => formatPrice(r.totalPurchases) },
    { key: 'outstanding', label: 'Outstanding', render: (r) => formatPrice(r.outstandingBalance || 0) },
    { key: 'status', label: 'Status', render: (r) => <Badge status={r.isActive ? 'active' : 'inactive'}>{r.isActive ? 'Active' : 'Inactive'}</Badge> },
    {
      key: 'actions', label: '', className: 'text-right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button aria-label="Edit supplier" onClick={() => { setEditing(r); setModalOpen(true); }} className="p-1.5 hover:bg-accent/30 rounded transition-colors"><Pencil className="h-4 w-4" /></button>
          <button aria-label="Delete supplier" onClick={() => setConfirmId(r._id)} className="p-1.5 hover:bg-destructive/10 text-destructive rounded transition-colors"><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="animate-fade-up">
        <PageHeader title="Suppliers" description="Mills, distributors & individual suppliers"
          actions={<Button onClick={() => { setEditing(null); setModalOpen(true); }}><Plus className="h-4 w-4 mr-1" /> New supplier</Button>} />
      </div>
      <FilterBar search={search} onSearch={(v) => { setSearch(v); setPage(1); }} placeholder="Search by name, code or phone" />
      <DataTable columns={columns} data={data?.data || []} loading={isLoading} pagination={data?.pagination} onPageChange={setPage} />

      <SupplierFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initial={editing}
        onSubmit={handleSave}
        loading={creating || updating}
      />
      <ConfirmDialog
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        title="Delete supplier?"
        onConfirm={async () => {
          try { await remove(confirmId).unwrap(); toast.success('Deleted'); setConfirmId(null); }
          catch (err) { toast.error(apiErrorMessage(err, 'Cannot delete supplier')); }
        }}
        loading={deleting}
      />
    </div>
  );
}

function SupplierFormModal({ open, onClose, initial, onSubmit, loading }) {
  const { register, handleSubmit } = useForm({
    values: initial ? {
      name: initial.name, type: initial.type, phone: initial.phone,
      contactPerson: initial.contactPerson, email: initial.email,
      city: initial.address?.city, line1: initial.address?.line1,
      ntn: initial.ntn, gst: initial.gst, paymentTerms: initial.paymentTerms,
      notes: initial.notes, isActive: initial.isActive,
    } : { name: '', type: 'mill', phone: '', contactPerson: '', email: '', city: '', line1: '', ntn: '', gst: '', paymentTerms: '', notes: '', isActive: true },
  });

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit supplier' : 'New supplier'} size="lg"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={handleSubmit((v) => onSubmit({ ...v, address: { city: v.city, line1: v.line1 } }))} loading={loading}>{initial ? 'Save' : 'Create'}</Button></>}>
      <form className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2"><Label required>Supplier name</Label><Input {...register('name', { required: true })} /></div>
        <div><Label>Type</Label><Select {...register('type')}>{['mill','distributor','individual','wholesaler','other'].map((t) => <option key={t} value={t}>{t}</option>)}</Select></div>
        <div><Label required>Phone</Label><Input {...register('phone', { required: true })} /></div>
        <div><Label>Contact person</Label><Input {...register('contactPerson')} /></div>
        <div><Label>Email</Label><Input type="email" {...register('email')} /></div>
        <div className="sm:col-span-2"><Label>Address</Label><Input {...register('line1')} /></div>
        <div><Label>City</Label><Input {...register('city')} /></div>
        <div><Label>Payment terms</Label><Input {...register('paymentTerms')} placeholder="Net 30, 50% advance…" /></div>
        <div><Label>NTN</Label><Input {...register('ntn')} /></div>
        <div><Label>GST</Label><Input {...register('gst')} /></div>
        <div className="sm:col-span-2"><Label>Notes</Label><Textarea rows={2} {...register('notes')} /></div>
      </form>
    </Modal>
  );
}
