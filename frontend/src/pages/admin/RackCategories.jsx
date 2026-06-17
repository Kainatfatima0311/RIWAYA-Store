import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import {
  useListRackCategoriesQuery,
  useCreateRackCategoryMutation,
  useUpdateRackCategoryMutation,
  useDeleteRackCategoryMutation,
} from '@/api/warehouseApi';
import { PageHeader } from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { FilterBar } from '@/components/admin/FilterBar';
import { Modal } from '@/components/admin/Modal';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { apiErrorMessage } from '@/lib/apiError';

export default function RackCategories() {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  const { data, isLoading } = useListRackCategoriesQuery({ search });
  const all = data?.data || [];

  const [create, { isLoading: creating }] = useCreateRackCategoryMutation();
  const [update, { isLoading: updating }] = useUpdateRackCategoryMutation();
  const [remove, { isLoading: deleting }] = useDeleteRackCategoryMutation();

  const handleSave = async (values) => {
    try {
      if (editing) {
        await update({ id: editing._id, ...values }).unwrap();
        toast.success('Updated');
      } else {
        await create(values).unwrap();
        toast.success('Created');
      }
      setModalOpen(false);
    } catch (err) { toast.error(apiErrorMessage(err, 'Failed')); }
  };

  const columns = [
    {
      key: 'name', label: 'Name',
      render: (r) => (
        <div className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded-full border" style={{ backgroundColor: r.color || '#e5e7eb' }} />
          <span className="font-medium">{r.name}</span>
        </div>
      ),
    },
    { key: 'slug', label: 'Slug', render: (r) => <span className="font-mono text-xs">{r.slug}</span> },
    { key: 'description', label: 'Description', render: (r) => <span className="text-sm text-muted-foreground">{r.description || '—'}</span> },
    {
      key: 'status', label: 'Status',
      render: (r) => <Badge status={r.isActive ? 'active' : 'inactive'}>{r.isActive ? 'Active' : 'Inactive'}</Badge>,
    },
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
      <div className="animate-fade-up">
        <PageHeader
          title="Rack Categories"
          description="Labels used to organize racks and stock items (e.g. Bridal, Formal, Embroidery)."
          actions={<Button onClick={() => { setEditing(null); setModalOpen(true); }}><Plus className="h-4 w-4 mr-1" /> New rack category</Button>}
        />
        <FilterBar search={search} onSearch={setSearch} placeholder="Search rack categories" />
      </div>
      <DataTable columns={columns} data={all} loading={isLoading} />

      <RackCategoryFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initial={editing}
        onSubmit={handleSave}
        loading={creating || updating}
      />
      <ConfirmDialog
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        title="Delete rack category?"
        description="Will fail if any rack still uses it. Reassign those racks or deactivate instead."
        onConfirm={async () => {
          try { await remove(confirmId).unwrap(); toast.success('Deleted'); setConfirmId(null); }
          catch (err) { toast.error(apiErrorMessage(err, 'Cannot delete')); }
        }}
        loading={deleting}
      />
    </div>
  );
}

function RackCategoryFormModal({ open, onClose, initial, onSubmit, loading }) {
  const { register, handleSubmit } = useForm({
    values: initial ? {
      name: initial.name,
      description: initial.description || '',
      color: initial.color || '#8B1538',
      isActive: initial.isActive ?? true,
    } : { name: '', description: '', color: '#8B1538', isActive: true },
  });

  return (
    <Modal
      open={open} onClose={onClose}
      title={initial ? 'Edit rack category' : 'New rack category'}
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={handleSubmit(onSubmit)} loading={loading}>{initial ? 'Save' : 'Create'}</Button></>}
    >
      <form className="space-y-3">
        <div><Label required>Name</Label><Input {...register('name', { required: true })} placeholder="Bridal, Formal, Embroidery…" /></div>
        <div><Label>Description</Label><Textarea rows={2} {...register('description')} placeholder="What goes in this group" /></div>
        <div>
          <Label>Color tag</Label>
          <div className="flex items-center gap-2">
            <input type="color" {...register('color')} className="h-10 w-16 rounded border bg-background p-1 cursor-pointer" />
            <span className="text-xs text-muted-foreground">Pick a color to label this group in tables</span>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...register('isActive')} /> Active</label>
      </form>
    </Modal>
  );
}
