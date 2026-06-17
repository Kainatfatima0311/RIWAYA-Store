import { useState } from 'react';
import { CheckCircle2, XCircle, Clock, FileDown } from 'lucide-react';
import {
  useListPaymentsQuery,
  usePaymentStatsQuery,
  useRefundPaymentMutation,
  useUpdatePaymentStatusMutation,
} from '@/api/peopleApi';
import { PageHeader } from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { FilterBar, FilterField } from '@/components/admin/FilterBar';
import { Select } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Stagger } from '@/components/ui/Reveal';
import { CountUp } from '@/components/ui/CountUp';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { toast } from 'sonner';
import { formatPrice, formatDateTime } from '@/lib/format';
import { apiErrorMessage } from '@/lib/apiError';

export default function Payments() {
  const [filters, setFilters] = useState({ method: '', status: '' });
  const [page, setPage] = useState(1);
  const [refundId, setRefundId] = useState(null);

  const { data, isLoading } = useListPaymentsQuery({ ...filters, page, limit: 20 });
  const { data: pendingData } = useListPaymentsQuery({ status: 'pending', limit: 1 });
  const { data: stats } = usePaymentStatsQuery();
  const [refund, { isLoading: refunding }] = useRefundPaymentMutation();
  const [updateStatus] = useUpdatePaymentStatusMutation();

  const summary = stats?.data?.summary || { totalPayments: 0, totalAmount: 0 };
  const byMethod = stats?.data?.byMethod || [];
  const pendingCount = pendingData?.pagination?.total || 0;

  const handleApprove = async (id, paymentNumber) => {
    try {
      await updateStatus({ id, status: 'completed' }).unwrap();
      toast.success(`${paymentNumber} approved — order paid`);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Approval failed'));
    }
  };

  const handleReject = async (id, paymentNumber) => {
    try {
      await updateStatus({ id, status: 'failed' }).unwrap();
      toast.success(`${paymentNumber} marked as failed`);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed'));
    }
  };

  const handleReceipt = async (p) => {
    try {
      const { downloadPaymentReceipt } = await import('@/lib/pdf');
      downloadPaymentReceipt(p);
    } catch {
      toast.error('Could not generate receipt');
    }
  };

  const columns = [
    { key: 'paymentNumber', label: 'Receipt #', render: (r) => <span className="font-mono text-xs">{r.paymentNumber}</span> },
    { key: 'order', label: 'Order', render: (r) => r.order?.orderNumber || '—' },
    { key: 'customer', label: 'Customer', render: (r) => r.customer?.name || '—' },
    { key: 'method', label: 'Method', render: (r) => <Badge variant="outline">{r.method?.replace(/_/g, ' ')}</Badge> },
    { key: 'reference', label: 'Reference', render: (r) => r.transactionId || r.referenceNumber || '—' },
    { key: 'amount', label: 'Amount', render: (r) => <span className="font-semibold">{formatPrice(r.amount)}</span> },
    { key: 'status', label: 'Status', render: (r) => <Badge status={r.status}>{r.status}</Badge> },
    { key: 'when', label: 'When', render: (r) => formatDateTime(r.paidAt) },
    {
      key: 'actions', label: '', className: 'text-right',
      render: (r) => {
        if (r.status === 'pending') {
          return (
            <div className="flex items-center justify-end gap-1">
              <Button size="sm" onClick={() => handleApprove(r._id, r.paymentNumber)} className="bg-emerald-600 hover:bg-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleReject(r._id, r.paymentNumber)}>
                <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
              </Button>
            </div>
          );
        }
        if (r.status === 'completed') {
          return (
            <div className="flex items-center justify-end gap-1">
              <Button size="sm" variant="outline" onClick={() => handleReceipt(r)} aria-label="Download receipt">
                <FileDown className="h-3.5 w-3.5 mr-1" /> Receipt
              </Button>
              <Button size="sm" variant="outline" onClick={() => setRefundId(r._id)}>Refund</Button>
            </div>
          );
        }
        return null;
      },
    },
  ];

  return (
    <div>
      <PageHeader title="Payments" description="Approve customer payments, manage refunds, track all transactions" />

      <Stagger step={70} maxDelay={400} animation="fade-up-sm" className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className={`hover-lift-sm ${pendingCount > 0 ? 'border-amber-300 bg-amber-50/40' : ''}`}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Pending verification</div>
                <div className={`text-2xl font-semibold ${pendingCount > 0 ? 'text-amber-600' : ''}`}><CountUp value={pendingCount} /></div>
                {pendingCount > 0 && (
                  <button
                    onClick={() => setFilters({ ...filters, status: 'pending' })}
                    className="text-xs text-amber-700 link-underline transition-colors mt-1 cursor-pointer"
                  >
                    Review now →
                  </button>
                )}
              </div>
              <Clock className={`h-8 w-8 ${pendingCount > 0 ? 'text-amber-500 animate-pulse' : 'text-muted-foreground'}`} />
            </div>
          </CardContent>
        </Card>
        <Card className="hover-lift-sm"><CardContent className="pt-6"><div className="text-xs text-muted-foreground">Completed payments</div><div className="text-2xl font-semibold"><CountUp value={summary.totalPayments} /></div></CardContent></Card>
        <Card className="hover-lift-sm"><CardContent className="pt-6"><div className="text-xs text-muted-foreground">Total collected</div><div className="text-2xl font-semibold text-primary"><CountUp value={summary.totalAmount} format={formatPrice} /></div></CardContent></Card>
        <Card className="hover-lift-sm"><CardContent className="pt-6"><div className="text-xs text-muted-foreground mb-2">By method</div><div className="space-y-1 text-xs">{byMethod.slice(0, 4).map((m) => <div key={m._id} className="flex justify-between"><span className="capitalize">{m._id?.replace(/_/g, ' ')}</span><span>{formatPrice(m.value)}</span></div>)}{!byMethod.length && <div className="text-muted-foreground">No data yet</div>}</div></CardContent></Card>
      </Stagger>

      <FilterBar>
        <FilterField label="Method">
          <Select value={filters.method} onChange={(e) => setFilters({ ...filters, method: e.target.value })}>
            <option value="">All</option>
            {['cash', 'cod', 'stripe', 'jazzcash', 'easypaisa', 'bank_transfer', 'cheque', 'card', 'other'].map((m) => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
          </Select>
        </FilterField>
        <FilterField label="Status">
          <Select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All</option>
            {['pending', 'completed', 'failed', 'refunded', 'cancelled'].map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </FilterField>
      </FilterBar>

      <DataTable columns={columns} data={data?.data || []} loading={isLoading} pagination={data?.pagination} onPageChange={setPage} />

      <ConfirmDialog
        open={!!refundId}
        onClose={() => setRefundId(null)}
        title="Refund this payment?"
        confirmLabel="Refund"
        loading={refunding}
        onConfirm={async () => {
          try { await refund({ id: refundId, reason: 'Manual refund from admin panel' }).unwrap(); toast.success('Refunded'); setRefundId(null); }
          catch (err) { toast.error(apiErrorMessage(err, 'Failed')); }
        }}
      />
    </div>
  );
}
