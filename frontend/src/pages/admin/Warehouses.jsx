import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  useListWarehousesQuery,
  useCreateWarehouseMutation,
  useUpdateWarehouseMutation,
  useDeleteWarehouseMutation,
} from '@/api/warehouseApi';
import { PageHeader } from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { FilterBar } from '@/components/admin/FilterBar';
import { Modal } from '@/components/admin/Modal';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label, FormError } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { useForm } from 'react-hook-form';

export default function Warehouses() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  const { data, isLoading } = useListWarehousesQuery({ search, page, limit: 20 });
  const [createWh, { isLoading: creating }] = useCreateWarehouseMutation();
  const [updateWh, { isLoading: updating }] = useUpdateWarehouseMutation();
  const [deleteWh, { isLoading: deleting }] = useDeleteWarehouseMutation();

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (wh) => { setEditing(wh); setModalOpen(true); };

  const handleDelete = async () => {
    try {
      await deleteWh(confirmId).unwrap();
      toast.success('Warehouse deleted');
      setConfirmId(null);
    } catch (err) {
      toast.error(err?.data?.message || 'Cannot delete');
    }
  };

  const columns = [
    { key: 'name', label: 'Name', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'code', label: 'Code', render: (r) => <span className="font-mono text-xs">{r.code}</span> },
    { key: 'city', label: 'Location', render: (r) => `${r.location?.city || ''}${r.location?.area ? ', ' + r.location.area : ''}` },
    { key: 'floors', label: 'Floors', render: (r) => r.totalFloors || 0 },
    { key: 'racks', label: 'Racks', render: (r) => r.totalRacks || 0 },
    { key: 'capacity', label: 'Capacity', render: (r) => `${r.currentOccupancy || 0} / ${r.storageCapacity || 0}` },
    {
      key: 'status', label: 'Status',
      render: (r) => <Badge status={r.isActive ? 'active' : 'inactive'}>{r.isActive ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      key: 'actions', label: '', className: 'text-right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={(e) => { e.stopPropagation(); openEdit(r); }} className="p-1.5 hover:bg-accent/30 rounded"><Pencil className="h-4 w-4" /></button>
          <button onClick={(e) => { e.stopPropagation(); setConfirmId(r._id); }} className="p-1.5 hover:bg-destructive/10 text-destructive rounded"><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Warehouses"
        description="Locations, floors, racks and storage capacity"
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> New warehouse</Button>}
      />
      <FilterBar search={search} onSearch={(v) => { setSearch(v); setPage(1); }} placeholder="Search by name, code or city" />
      <DataTable
        columns={columns}
        data={data?.data || []}
        loading={isLoading}
        pagination={data?.pagination}
        onPageChange={setPage}
      />

      <WarehouseFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initial={editing}
        onSubmit={async (values) => {
          try {
            if (editing) {
              await updateWh({ id: editing._id, ...values }).unwrap();
              toast.success('Updated');
            } else {
              await createWh(values).unwrap();
              toast.success('Created');
            }
            setModalOpen(false);
          } catch (err) {
            toast.error(err?.data?.message || 'Failed');
          }
        }}
        loading={creating || updating}
      />

      <ConfirmDialog
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        title="Delete warehouse?"
        description="Cannot be undone. Will fail if floors/racks exist."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}

function WarehouseFormModal({ open, onClose, initial, onSubmit, loading }) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    values: initial
      ? {
          name: initial.name,
          code: initial.code,
          city: initial.location?.city,
          area: initial.location?.area,
          address: initial.location?.address,
          areaMarla: initial.areaMarla,
          totalFloors: initial.totalFloors,
          storageCapacity: initial.storageCapacity,
        }
      : { name: '', code: '', city: '', area: '', address: '', areaMarla: 0, totalFloors: 0, storageCapacity: 0 },
  });

  const submit = (v) => {
    onSubmit({
      name: v.name,
      code: v.code,
      location: { address: v.address || v.name, city: v.city, area: v.area || undefined },
      areaMarla: v.areaMarla ? Number(v.areaMarla) : undefined,
      totalFloors: v.totalFloors ? Number(v.totalFloors) : undefined,
      storageCapacity: v.storageCapacity ? Number(v.storageCapacity) : undefined,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit warehouse' : 'New warehouse'}
      size="lg"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={handleSubmit(submit)} loading={loading}>{initial ? 'Save' : 'Create'}</Button></>}
    >
      <form className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Label required>Name</Label><Input {...register('name', { required: true })} /></div>
        <div><Label required>Code</Label><Input {...register('code', { required: true })} placeholder="WH-LHR-01" /></div>
        <div><Label required>City</Label><Input {...register('city', { required: true })} placeholder="Lahore" /></div>
        <div><Label>Area</Label><Input {...register('area')} placeholder="DHA Phase 5" /></div>
        <div className="col-span-2"><Label>Full address</Label><Input {...register('address')} /></div>
        <div><Label>Area (marla)</Label><Input type="number" {...register('areaMarla')} /></div>
        <div><Label>Total floors</Label><Input type="number" {...register('totalFloors')} /></div>
        <div className="col-span-2"><Label>Storage capacity (units)</Label><Input type="number" {...register('storageCapacity')} /></div>
      </form>
    </Modal>
  );
}
