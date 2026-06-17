import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import {
  useListEmployeesQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
  useSetEmployeeStatusMutation,
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
import { apiErrorMessage } from '@/lib/apiError';

const DEPARTMENTS = ['warehouse', 'sales', 'inventory', 'accounts', 'admin', 'hr', 'it', 'marketing', 'logistics', 'production', 'other'];
const STATUSES = ['active', 'on_leave', 'suspended', 'terminated', 'resigned', 'probation'];
const SALARY_SUFFIX = { monthly: 'mo', weekly: 'wk', daily: 'day', hourly: 'hr' };

export default function Employees() {
  const [filters, setFilters] = useState({ search: '', department: '', status: '' });
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  const { data, isLoading } = useListEmployeesQuery({ ...filters, page, limit: 20 });
  const [create, { isLoading: creating }] = useCreateEmployeeMutation();
  const [update, { isLoading: updating }] = useUpdateEmployeeMutation();
  const [setStatus] = useSetEmployeeStatusMutation();
  const [remove, { isLoading: deleting }] = useDeleteEmployeeMutation();

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

  const columns = [
    { key: 'name', label: 'Employee', render: (r) => <div><div className="font-medium">{r.name}</div><div className="text-xs text-muted-foreground font-mono">{r.employeeCode}</div></div> },
    { key: 'designation', label: 'Designation' },
    { key: 'department', label: 'Dept', render: (r) => <Badge variant="outline" className="capitalize">{r.department}</Badge> },
    { key: 'phone', label: 'Phone' },
    { key: 'salary', label: 'Salary', render: (r) => `${formatPrice(r.salary)}/${SALARY_SUFFIX[r.salaryFrequency] || r.salaryFrequency || ''}` },
    { key: 'joiningDate', label: 'Joined', render: (r) => formatDate(r.joiningDate) },
    { key: 'status', label: 'Status', render: (r) => (
      <Select value={r.status} onChange={(e) => handleSetStatus(r._id, e.target.value)} className="h-8 text-xs w-32">
        {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
      </Select>
    ) },
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
        <PageHeader title="Employees" description="HR records, departments, salaries"
          actions={<Button onClick={() => { setEditing(null); setModalOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add employee</Button>} />
      </div>

      <FilterBar search={filters.search} onSearch={(v) => { setFilters({ ...filters, search: v }); setPage(1); }} placeholder="Search by name, phone, code">
        <FilterField label="Department">
          <Select value={filters.department} onChange={(e) => setFilters({ ...filters, department: e.target.value })}>
            <option value="">All</option>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </Select>
        </FilterField>
        <FilterField label="Status">
          <Select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
          </Select>
        </FilterField>
      </FilterBar>

      <DataTable columns={columns} data={data?.data || []} loading={isLoading} pagination={data?.pagination} onPageChange={setPage} />

      <EmployeeFormModal open={modalOpen} onClose={() => setModalOpen(false)} initial={editing} onSubmit={handleSave} loading={creating || updating} />
      <ConfirmDialog open={!!confirmId} onClose={() => setConfirmId(null)} title="Delete employee?"
        onConfirm={async () => { try { await remove(confirmId).unwrap(); toast.success('Deleted'); setConfirmId(null); } catch (err) { toast.error(apiErrorMessage(err, 'Failed')); } }} loading={deleting} />
    </div>
  );
}

export function EmployeeFormModal({ open, onClose, initial, onSubmit, loading }) {
  const { register, handleSubmit } = useForm({
    values: initial ? {
      name: initial.name, phone: initial.phone, email: initial.email || '',
      cnic: initial.cnic, designation: initial.designation, department: initial.department,
      joiningDate: initial.joiningDate?.slice(0, 10), salary: initial.salary,
      salaryFrequency: initial.salaryFrequency, workType: initial.workType, notes: initial.notes,
    } : { name: '', phone: '', email: '', cnic: '', designation: '', department: 'warehouse', joiningDate: '', salary: '', salaryFrequency: 'monthly', workType: 'full_time', notes: '' },
  });

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit employee' : 'Add employee'} size="lg"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={handleSubmit((v) => onSubmit({ ...v, salary: Number(v.salary) }))} loading={loading}>{initial ? 'Save' : 'Add'}</Button></>}>
      <form className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="col-span-2"><Label required>Name</Label><Input {...register('name', { required: true })} /></div>
        <div><Label required>Phone</Label><Input {...register('phone', { required: true })} /></div>
        <div><Label>Email</Label><Input type="email" {...register('email')} /></div>
        <div><Label required>CNIC</Label><Input {...register('cnic', { required: true })} placeholder="00000-0000000-0" /></div>
        <div><Label required>Designation</Label><Input {...register('designation', { required: true })} placeholder="Warehouse Manager…" /></div>
        <div><Label required>Department</Label><Select {...register('department')}>{DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}</Select></div>
        <div><Label>Work type</Label><Select {...register('workType')}>{['full_time','part_time','contract','intern'].map((w) => <option key={w} value={w}>{w.replace('_',' ')}</option>)}</Select></div>
        <div><Label required>Joining date</Label><Input type="date" {...register('joiningDate', { required: true })} /></div>
        <div><Label required>Salary (Rs)</Label><Input type="number" {...register('salary', { required: true })} /></div>
        <div className="col-span-2"><Label>Frequency</Label><Select {...register('salaryFrequency')}>{['monthly','weekly','daily','hourly'].map((f) => <option key={f} value={f}>{f}</option>)}</Select></div>
        <div className="col-span-2"><Label>Notes</Label><Textarea rows={2} {...register('notes')} /></div>
      </form>
    </Modal>
  );
}
