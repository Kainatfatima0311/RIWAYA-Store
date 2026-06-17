import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, Image as ImageIcon, Star } from 'lucide-react';
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
import { ImageUploader } from '@/components/admin/ImageUploader';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { apiErrorMessage } from '@/lib/apiError';

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
    } catch (err) { toast.error(apiErrorMessage(err, 'Failed')); }
  };

  const toggleDisplay = async (cat) => {
    try {
      await update({ id: cat._id, displayOnFrontend: !cat.displayOnFrontend }).unwrap();
      toast.success(`${cat.displayOnFrontend ? 'Hidden from' : 'Shown on'} storefront`);
    } catch (err) { toast.error(apiErrorMessage(err, 'Failed')); }
  };

  const columns = [
    {
      key: 'image', label: '',
      render: (r) => (
        r.image?.url
          ? <img src={r.image.url} alt="" className="h-10 w-10 rounded object-cover border" />
          : <div className="h-10 w-10 rounded border bg-muted flex items-center justify-center"><ImageIcon className="h-4 w-4 text-muted-foreground" /></div>
      ),
    },
    {
      key: 'name', label: 'Name',
      render: (r) => (
        <span className="font-medium inline-flex items-center gap-1.5">
          {r.name}
          {r.isFeatured && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />}
        </span>
      ),
    },
    { key: 'slug', label: 'Slug', render: (r) => <span className="font-mono text-xs">{r.slug}</span> },
    { key: 'parent', label: 'Parent', render: (r) => r.parent?.name || '—' },
    { key: 'products', label: 'Products', render: (r) => r.productCount || 0 },
    {
      key: 'display', label: 'Frontend',
      render: (r) => (
        <button onClick={() => toggleDisplay(r)} className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground">
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
          title="Product Categories"
          description="Tree-structured categories. Toggle frontend visibility per category."
          actions={<Button onClick={() => { setEditing(null); setModalOpen(true); }}><Plus className="h-4 w-4 mr-1" /> New category</Button>}
        />
      </div>
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
          catch (err) { toast.error(apiErrorMessage(err, 'Cannot delete')); }
        }}
        loading={deleting}
      />
    </div>
  );
}

function CategoryFormModal({ open, onClose, initial, allCategories, onSubmit, loading }) {
  const { register, handleSubmit } = useForm({
    values: initial ? {
      name: initial.name,
      description: initial.description || '',
      parent: initial.parent?._id || '',
      displayOnFrontend: initial.displayOnFrontend ?? true,
      displayOrder: initial.displayOrder ?? 0,
      isFeatured: initial.isFeatured ?? false,
      isActive: initial.isActive ?? true,
    } : { name: '', description: '', parent: '', displayOnFrontend: true, displayOrder: 0, isFeatured: false, isActive: true },
  });

  // Category image is a single { url, publicId } — managed outside react-hook-form
  // since <ImageUploader> is a controlled component. Re-sync whenever the row changes.
  const [image, setImage] = useState([]);
  useEffect(() => {
    setImage(initial?.image?.url ? [{ url: initial.image.url, publicId: initial.image.publicId || '' }] : []);
  }, [initial, open]);

  const submit = handleSubmit((v) =>
    onSubmit({
      ...v,
      parent: v.parent || null,
      displayOrder: Number(v.displayOrder) || 0,
      image: image[0] || { url: '', publicId: '' },
    })
  );

  return (
    <Modal
      open={open} onClose={onClose}
      title={initial ? 'Edit category' : 'New category'}
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={submit} loading={loading}>{initial ? 'Save' : 'Create'}</Button></>}
    >
      <form className="space-y-3">
        <div><Label required>Name</Label><Input {...register('name', { required: true, minLength: { value: 2, message: 'Name must be at least 2 characters' } })} placeholder="Bridal, Embroidered…" /></div>

        <div>
          <Label>Category image (shown in “Shop by Category” on the home page)</Label>
          <ImageUploader value={image} onChange={setImage} category="categories" single />
        </div>

        <div><Label>Parent (optional)</Label>
          <Select {...register('parent')}>
            <option value="">(Top-level)</option>
            {allCategories.filter((c) => c._id !== initial?._id).map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </Select>
        </div>
        <div><Label>Description</Label><Textarea rows={2} {...register('description')} /></div>
        <div><Label>Display order (lower shows first)</Label><Input type="number" {...register('displayOrder')} /></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...register('displayOnFrontend')} /> Show on storefront</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...register('isFeatured')} /> Featured</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...register('isActive')} /> Active</label>
        </div>
      </form>
    </Modal>
  );
}
