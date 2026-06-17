import { useState } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import {
  useListProductCategoriesQuery,
  useCreateProductCategoryMutation,
  useUpdateProductCategoryMutation,
  useDeleteProductCategoryMutation,
} from '@/api/productApi';
import { PageHeader } from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { FilterBar } from '@/components/admin/FilterBar';
import { Modal } from '@/components/admin/Modal';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';

export default function Categories() {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  const { data, isLoading } = useListProductCategoriesQuery({ search });
  const all = data?.data || [];

  const [create, { isLoading: creating }] = useCreateProductCategoryMutation();
  const [update, { isLoading: updating }] = useUpdateProductCategoryMutation();
  const [remove, { isLoading: deleting }] = useDeleteProductCategoryMutation();

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
    } catch (err) { toast.error(err?.data?.message || 'Failed'); }
  };

  const toggleDisplay = async (cat) => {
    try {
      await update({ id: cat._id, displayOnFrontend: !cat.displayOnFrontend }).unwrap();
      toast.success(`${cat.displayOnFrontend ? 'Hidden from' : 'Shown on'} storefront`);
    } catch (err) { toast.error(err?.data?.message || 'Failed'); }
  };

  const columns = [
    { key: 'name', label: 'Name', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'slug', label: 'Slug', render: (r) => <span className="font-mono text-xs">{r.slug}</span> },
    { key: 'parent', label: 'Parent', render: (r) => r.parent?.name || '—' },
    { key: 'products', label: 'Products', render: (r) => r.productCount || 0 },
    {
      key: 'display', label: 'Frontend',
      render: (r) => (
        <button onClick={() => toggleDisplay(r)} className="inline-flex items-center gap-1.5">
          {r.displayOnFrontend ? <Eye className="h-4 w-4 text-emerald-600" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
          <span className="text-xs">{r.displayOnFrontend ? 'Visible' : 'Hidden'}</span>
        </button>
      ),
    },
    {
      key: 'status', label: 'Status',
      render: (r) => <Badge status={r.isActive ? 'active' : 'inactive'}>{r.isActive ? 'Active' : 'Inactive'}</Badge>,
    },
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
      <PageHeader
        title="Product Categories"
        description="Tree-structured categories. Toggle frontend visibility per category."
        actions={<Button onClick={() => { setEditing(null); setModalOpen(true); }}><Plus className="h-4 w-4 mr-1" /> New category</Button>}
      />
      <FilterBar search={search} onSearch={setSearch} placeholder="Search categories" />
      <DataTable columns={columns} data={all} loading={isLoading} />

      <CategoryFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initial={editing}
        allCategories={all}
        onSubmit={handleSave}
        loading={creating || updating}
      />
      <ConfirmDialog
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        title="Delete category?"
        description="Will fail if products or sub-categories are linked."
        onConfirm={async () => {
          try { await remove(confirmId).unwrap(); toast.success('Deleted'); setConfirmId(null); }
          catch (err) { toast.error(err?.data?.message || 'Cannot delete'); }
        }}
        loading={deleting}
      />
    </div>
  );
}

function CategoryFormModal({ open, onClose, initial, allCategories, onSubmit, loading }) {
  const { register, handleSubmit, reset } = useForm({
    values: initial ? {
      name: initial.name,
      description: initial.description || '',
      parent: initial.parent?._id || '',
      displayOnFrontend: initial.displayOnFrontend ?? true,
      displayOrder: initial.displayOrder || 0,
      isActive: initial.isActive ?? true,
    } : { name: '', description: '', parent: '', displayOnFrontend: true, displayOrder: 0, isActive: true },
  });

  return (
    <Modal
      open={open} onClose={onClose}
      title={initial ? 'Edit category' : 'New category'}
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={handleSubmit((v) => onSubmit({ ...v, parent: v.parent || null }))} loading={loading}>{initial ? 'Save' : 'Create'}</Button></>}
    >
      <form className="space-y-3">
        <div><Label required>Name</Label><Input {...register('name', { required: true })} placeholder="Bridal, Embroidered…" /></div>
        <div><Label>Parent (optional)</Label>
          <Select {...register('parent')}>
            <option value="">(Top-level)</option>
            {allCategories.filter((c) => c._id !== initial?._id).map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </Select>
        </div>
        <div><Label>Description</Label><Textarea rows={2} {...register('description')} /></div>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...register('displayOnFrontend')} /> Show on storefront</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...register('isActive')} /> Active</label>
        </div>
      </form>
    </Modal>
  );
}
