import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { ImageUploader } from '@/components/admin/ImageUploader';
import {
  useListProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useToggleProductDisplayMutation,
  useSetProductStatusMutation,
  useListProductCategoriesQuery,
} from '@/api/productApi';
import { useListStockItemsQuery } from '@/api/inventoryApi';
import { PageHeader } from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { FilterBar, FilterField } from '@/components/admin/FilterBar';
import { Modal } from '@/components/admin/Modal';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { formatPrice } from '@/lib/format';
import { apiErrorMessage } from '@/lib/apiError';

export default function Products() {
  const [filters, setFilters] = useState({ search: '', category: '', status: '' });
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  const { data, isLoading } = useListProductsQuery({ ...filters, page, limit: 20 });
  const { data: catData } = useListProductCategoriesQuery();
  const { data: stockData } = useListStockItemsQuery({ limit: 200 });

  const [create, { isLoading: creating }] = useCreateProductMutation();
  const [update, { isLoading: updating }] = useUpdateProductMutation();
  const [toggle] = useToggleProductDisplayMutation();
  const [setStatus] = useSetProductStatusMutation();
  const [remove, { isLoading: deleting }] = useDeleteProductMutation();

  const handleSave = async (values) => {
    try {
      if (editing) await update({ id: editing._id, ...values }).unwrap();
      else await create(values).unwrap();
      toast.success(editing ? 'Updated' : 'Created');
      setModalOpen(false);
    } catch (err) { toast.error(apiErrorMessage(err, 'Failed')); }
  };

  const handleSetStatus = async (id, status) => {
    try {
      await setStatus({ id, status }).unwrap();
      toast.success('Status updated');
    } catch (err) { toast.error(apiErrorMessage(err, 'Failed to update status')); }
  };

  const handleToggleDisplay = async (r) => {
    try {
      await toggle({ id: r._id, displayOnFrontend: !r.displayOnFrontend }).unwrap();
      toast.success(r.displayOnFrontend ? 'Hidden' : 'Shown');
    } catch (err) { toast.error(apiErrorMessage(err, 'Failed to update visibility')); }
  };

  // Quick toggle for the home-page "Featured Pieces" section. Note: a product only
  // shows there when it is BOTH Featured and Published + visible on the storefront.
  const handleToggleFeatured = async (r) => {
    try {
      await update({ id: r._id, isFeatured: !r.isFeatured }).unwrap();
      toast.success(r.isFeatured ? 'Removed from Featured' : 'Added to Featured');
    } catch (err) { toast.error(apiErrorMessage(err, 'Failed to update featured')); }
  };

  const columns = [
    { key: 'name', label: 'Product', render: (r) => (
      <div className="flex items-center gap-3">
        <div className="w-10 h-12 rounded bg-muted overflow-hidden flex-shrink-0">
          {r.images?.[0]?.url && <img src={r.images[0].url} alt="" className="w-full h-full object-cover" />}
        </div>
        <div>
          <div className="font-medium">{r.name}</div>
          <div className="text-xs text-muted-foreground">{r.slug}</div>
        </div>
      </div>
    ) },
    { key: 'price', label: 'Price', render: (r) => <div>
      <div>{formatPrice(r.salePrice > 0 && r.salePrice < r.basePrice ? r.salePrice : r.basePrice)}</div>
      {r.salePrice > 0 && r.salePrice < r.basePrice && <div className="text-xs text-muted-foreground line-through">{formatPrice(r.basePrice)}</div>}
    </div> },
    { key: 'categories', label: 'Categories', render: (r) => r.categories?.map((c) => c.name || '').filter(Boolean).join(', ') || '—' },
    { key: 'status', label: 'Status', render: (r) => (
      <Select value={r.status} onChange={(e) => handleSetStatus(r._id, e.target.value)} className="h-8 text-xs w-28">
        {['draft','published','archived'].map((s) => <option key={s} value={s}>{s}</option>)}
      </Select>
    ) },
    { key: 'display', label: 'Frontend', render: (r) => (
      <button onClick={() => handleToggleDisplay(r)} className="inline-flex items-center gap-1.5 transition-colors" title="Show / hide on storefront">
        {r.displayOnFrontend ? <Eye className="h-4 w-4 text-emerald-600 transition-colors" /> : <EyeOff className="h-4 w-4 text-muted-foreground transition-colors" />}
      </button>
    ) },
    { key: 'featured', label: 'Featured', render: (r) => (
      <button onClick={() => handleToggleFeatured(r)} className="inline-flex items-center transition-colors" title="Toggle 'Featured Pieces' on the home page">
        <Star className={`h-4 w-4 transition-colors ${r.isFeatured ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground'}`} />
      </button>
    ) },
    { key: 'sold', label: 'Sold', render: (r) => r.totalSold || 0 },
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
        <PageHeader title="Products" description="Customer-facing catalog. Toggle frontend visibility per product."
          actions={<Button onClick={() => { setEditing(null); setModalOpen(true); }}><Plus className="h-4 w-4 mr-1" /> New product</Button>} />
      </div>

      <FilterBar search={filters.search} onSearch={(v) => { setFilters({ ...filters, search: v }); setPage(1); }} placeholder="Search">
        <FilterField label="Category">
          <Select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
            <option value="">All categories</option>
            {catData?.data?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </Select>
        </FilterField>
        <FilterField label="Status">
          <Select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </Select>
        </FilterField>
      </FilterBar>

      <DataTable columns={columns} data={data?.data || []} loading={isLoading} pagination={data?.pagination} onPageChange={setPage} />

      <ProductFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initial={editing}
        categories={catData?.data || []}
        stockItems={stockData?.data || []}
        onSubmit={handleSave}
        loading={creating || updating}
      />
      <ConfirmDialog open={!!confirmId} onClose={() => setConfirmId(null)} title="Delete product?"
        onConfirm={async () => { try { await remove(confirmId).unwrap(); toast.success('Deleted'); setConfirmId(null); } catch (err) { toast.error(apiErrorMessage(err, 'Failed')); } }} loading={deleting} />
    </div>
  );
}

function ProductFormModal({ open, onClose, initial, categories, stockItems, onSubmit, loading }) {
  const { register, handleSubmit } = useForm({
    values: initial ? {
      name: initial.name, brand: initial.brand || '', shortDescription: initial.shortDescription || '',
      description: initial.description || '', basePrice: initial.basePrice, salePrice: initial.salePrice || '',
      category: initial.categories?.[0]?._id || '', stockItem: initial.variants?.[0]?.stockItem?._id || initial.variants?.[0]?.stockItem || '',
      variantLabel: initial.variants?.[0]?.label || 'Default',
      displayOnFrontend: initial.displayOnFrontend, status: initial.status,
      isFeatured: initial.isFeatured ?? false, isNew: initial.isNew ?? false, isBestseller: initial.isBestseller ?? false,
    } : { name: '', brand: '', shortDescription: '', description: '', basePrice: '', salePrice: '', category: '', stockItem: '', variantLabel: 'Default', displayOnFrontend: false, status: 'draft', isFeatured: false, isNew: false, isBestseller: false },
  });

  const [images, setImages] = useState(initial?.images?.map((i) => ({ url: i.url, publicId: i.publicId })) || []);

  // Reset images when modal opens with a new product
  useEffect(() => {
    setImages(initial?.images?.map((i) => ({ url: i.url, publicId: i.publicId })) || []);
  }, [initial?._id, open]);

  const submit = (v) => {
    onSubmit({
      name: v.name,
      brand: v.brand || undefined,
      shortDescription: v.shortDescription || undefined,
      description: v.description || undefined,
      basePrice: Number(v.basePrice),
      salePrice: v.salePrice ? Number(v.salePrice) : undefined,
      categories: v.category ? [v.category] : [],
      variants: v.stockItem ? [{ label: v.variantLabel || 'Default', stockItem: v.stockItem, isDefault: true }] : [],
      images: images.map((img, i) => ({ url: img.url, publicId: img.publicId, isPrimary: i === 0 })),
      displayOnFrontend: v.displayOnFrontend,
      status: v.status,
      isFeatured: v.isFeatured,
      isNew: v.isNew,
      isBestseller: v.isBestseller,
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit product' : 'New product'} size="lg"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={handleSubmit(submit)} loading={loading}>{initial ? 'Save' : 'Create'}</Button></>}>
      <form className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2"><Label required>Name</Label><Input {...register('name', { required: true })} /></div>
        <div><Label>Brand</Label><Input {...register('brand')} /></div>
        <div><Label>Status</Label><Select {...register('status')}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></Select></div>
        <div className="sm:col-span-2"><Label>Short description</Label><Input {...register('shortDescription')} /></div>
        <div className="sm:col-span-2"><Label>Full description</Label><Textarea rows={3} {...register('description')} /></div>
        <div><Label required>Base price (Rs)</Label><Input type="number" {...register('basePrice', { required: true })} /></div>
        <div><Label>Sale price (Rs, optional)</Label><Input type="number" {...register('salePrice')} /></div>
        <div><Label required>Category</Label><Select {...register('category', { required: true })}>
          <option value="">Choose…</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </Select></div>
        <div><Label required>Linked stock item</Label><Select {...register('stockItem', { required: true })}>
          <option value="">Choose…</option>
          {stockItems.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.sku})</option>)}
        </Select></div>
        <div className="sm:col-span-2"><Label>Variant label</Label><Input {...register('variantLabel')} placeholder="Default / Red - L" /></div>
        <div className="sm:col-span-2">
          <Label>Images (first one becomes the primary)</Label>
          <ImageUploader value={images} onChange={setImages} category="products" max={6} />
        </div>
        <div className="sm:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...register('displayOnFrontend')} /> Show on storefront</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...register('isFeatured')} /> Featured</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...register('isNew')} /> New arrival</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...register('isBestseller')} /> Bestseller</label>
        </div>
        <p className="sm:col-span-2 text-xs text-muted-foreground">
          “Featured Pieces” on the home page shows products that are <strong>Featured</strong> and <strong>Published</strong> with storefront visibility on.
        </p>
      </form>
    </Modal>
  );
}
