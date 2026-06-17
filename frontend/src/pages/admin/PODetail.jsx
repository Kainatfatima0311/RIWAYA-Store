import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, Truck, Wallet, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import {
  useGetPOQuery,
  useApprovePOMutation,
  useCancelPOMutation,
  useAddPOReceiptMutation,
  useAddPOPaymentMutation,
} from '@/api/inventoryApi';
import { PageHeader } from '@/components/admin/PageHeader';
import { Modal } from '@/components/admin/Modal';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { PageSpinner } from '@/components/ui/Spinner';
import { Reveal, Stagger } from '@/components/ui/Reveal';
import { CountUp } from '@/components/ui/CountUp';
import { formatPrice, formatDate, formatDateTime } from '@/lib/format';
import { apiErrorMessage } from '@/lib/apiError';

const PAYMENT_METHODS = ['cash', 'bank_transfer', 'cheque', 'online', 'jazzcash', 'easypaisa', 'other'];

export default function PODetail() {
  const { id } = useParams();
  const { data, isLoading } = useGetPOQuery(id);
  const [approve, { isLoading: approving }] = useApprovePOMutation();
  const [cancel, { isLoading: cancelling }] = useCancelPOMutation();
  const [addReceipt, { isLoading: receiving }] = useAddPOReceiptMutation();
  const [addPayment, { isLoading: paying }] = useAddPOPaymentMutation();
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [downloading, setDownloading] = useState(false);

  if (isLoading) return <PageSpinner label="Loading PO…" />;
  const po = data?.data;
  if (!po) return <p>PO not found</p>;

  const handleDownloadPO = async () => {
    setDownloading(true);
    try {
      const { downloadPurchaseOrderPdf } = await import('@/lib/pdf');
      downloadPurchaseOrderPdf(po);
    } catch {
      toast.error('Could not generate PO');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="animate-fade-up">
      <Link to="/admin/purchase-orders" className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 mb-4">
        <ArrowLeft className="h-4 w-4" /> All POs
      </Link>

      <PageHeader
        title={po.poNumber}
        description={`Created ${formatDate(po.orderDate)} for ${po.supplier?.name}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadPO} loading={downloading} aria-label="Download purchase order">
              <FileDown className="h-4 w-4 mr-1" /> PDF
            </Button>
            {po.status === 'draft' && (
              <Button onClick={async () => { try { await approve(id).unwrap(); toast.success('PO approved'); } catch (err) { toast.error(apiErrorMessage(err)); } }} loading={approving}>
                <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
              </Button>
            )}
            {['placed', 'partially_received'].includes(po.status) && (
              <Button onClick={() => setReceiptOpen(true)} variant="outline"><Truck className="h-4 w-4 mr-1" /> Record receipt</Button>
            )}
            {['placed', 'partially_received', 'fully_received'].includes(po.status) && po.paymentStatus !== 'paid' && (
              <Button onClick={() => setPaymentOpen(true)} variant="outline"><Wallet className="h-4 w-4 mr-1" /> Record payment</Button>
            )}
            {!['cancelled', 'fully_received'].includes(po.status) && (
              <Button onClick={() => setCancelOpen(true)} variant="destructive"><XCircle className="h-4 w-4 mr-1" /> Cancel</Button>
            )}
          </div>
        }
      />

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-4">
          <Reveal animation="fade-up-sm" className="flex flex-wrap gap-2">
            <Badge status={po.status}>{po.status.replace(/_/g, ' ')}</Badge>
            <Badge status={po.paymentStatus}>{po.paymentStatus.replace(/_/g, ' ')}</Badge>
          </Reveal>

          {/* Items */}
          <Reveal animation="fade-up" delay={60}>
          <Card>
            <CardContent className="pt-6">
              <h2 className="font-semibold mb-3">Line items</h2>
              <div className="overflow-x-auto -mx-2 px-2">
              <table className="w-full min-w-[480px] text-sm">
                <thead className="border-b text-muted-foreground">
                  <tr>
                    <th className="text-left py-2">Item</th>
                    <th className="text-right py-2">Ordered</th>
                    <th className="text-right py-2">Received</th>
                    <th className="text-right py-2">Unit price</th>
                    <th className="text-right py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {po.items.map((it, idx) => (
                    <Reveal as="tr" key={it._id} animation="fade-up-sm" delay={Math.min(idx * 50, 400)} className="border-b last:border-0">
                      <td className="py-2">
                        <div className="font-medium">{it.name}</div>
                        {it.variant && <div className="text-xs text-muted-foreground">{it.variant}</div>}
                      </td>
                      <td className="text-right">{it.quantityOrdered} {it.unit}</td>
                      <td className="text-right">
                        <span className={it.quantityReceived >= it.quantityOrdered ? 'text-emerald-600 font-medium' : it.quantityReceived > 0 ? 'text-amber-600' : 'text-muted-foreground'}>
                          {it.quantityReceived} / {it.quantityOrdered}
                        </span>
                      </td>
                      <td className="text-right">{formatPrice(it.unitPrice)}</td>
                      <td className="text-right font-medium">{formatPrice(it.totalPrice)}</td>
                    </Reveal>
                  ))}
                </tbody>
              </table>
              </div>
            </CardContent>
          </Card>
          </Reveal>

          {/* Receipts */}
          {po.receipts?.length > 0 && (
            <Reveal animation="fade-up" delay={120}>
            <Card>
              <CardContent className="pt-6">
                <h2 className="font-semibold mb-3">Receipts ({po.receipts.length})</h2>
                <Stagger as="ul" childAs="li" step={60} maxDelay={400} className="space-y-2 text-sm">
                  {po.receipts.map((r) => (
                    <div key={r._id} className="border rounded p-3 hover-lift-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{formatDateTime(r.receivedAt)}</span>
                        <span className="text-xs text-muted-foreground">by {r.receivedBy?.name || '—'}</span>
                      </div>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        {r.items.map((i) => <li key={i._id}>• {i.name}: {i.quantity} units</li>)}
                      </ul>
                      {r.notes && <p className="text-xs mt-1 text-muted-foreground italic">{r.notes}</p>}
                    </div>
                  ))}
                </Stagger>
              </CardContent>
            </Card>
            </Reveal>
          )}

          {/* Payments */}
          {po.payments?.length > 0 && (
            <Reveal animation="fade-up" delay={180}>
            <Card>
              <CardContent className="pt-6">
                <h2 className="font-semibold mb-3">Payments ({po.payments.length})</h2>
                <Stagger as="ul" childAs="li" step={60} maxDelay={400} className="space-y-2 text-sm">
                  {po.payments.map((p) => (
                    <div key={p._id} className="border rounded p-3 flex items-center justify-between hover-lift-sm">
                      <div>
                        <div className="font-medium">{formatPrice(p.amount)} via {p.method?.replace(/_/g, ' ')}</div>
                        <div className="text-xs text-muted-foreground">{formatDateTime(p.paidAt)} · {p.reference || '—'}</div>
                      </div>
                      <Wallet className="h-5 w-5 text-emerald-600" />
                    </div>
                  ))}
                </Stagger>
              </CardContent>
            </Card>
            </Reveal>
          )}
        </div>

        {/* Sidebar summary */}
        <aside>
          <Reveal animation="fade-up-sm" delay={60}>
          <Card className="sticky top-20 hover-lift">
            <CardContent className="pt-6 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(po.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tax ({po.taxRate}%)</span><span>{formatPrice(po.taxAmount)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{formatPrice(po.shippingCost)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>-{formatPrice(po.discount)}</span></div>
              <div className="flex justify-between font-semibold text-base pt-2 border-t"><span>Grand total</span><span className="text-primary"><CountUp value={po.grandTotal} format={formatPrice} /></span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span><CountUp value={po.paidAmount} format={formatPrice} /></span></div>
              <div className="flex justify-between font-medium"><span>Outstanding</span><span className="text-destructive"><CountUp value={po.grandTotal - po.paidAmount} format={formatPrice} /></span></div>
            </CardContent>
          </Card>
          </Reveal>
        </aside>
      </div>

      {/* Receipt modal */}
      <ReceiptModal open={receiptOpen} onClose={() => setReceiptOpen(false)} po={po} onSubmit={async (v) => { try { await addReceipt({ id, ...v }).unwrap(); toast.success('Receipt recorded'); setReceiptOpen(false); } catch (err) { toast.error(apiErrorMessage(err)); } }} loading={receiving} />

      {/* Payment modal */}
      <PaymentModal open={paymentOpen} onClose={() => setPaymentOpen(false)} po={po} onSubmit={async (v) => { try { await addPayment({ id, ...v }).unwrap(); toast.success('Payment recorded'); setPaymentOpen(false); } catch (err) { toast.error(apiErrorMessage(err)); } }} loading={paying} />

      {/* Cancel modal */}
      <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} title="Cancel PO?"
        footer={<><Button variant="outline" onClick={() => setCancelOpen(false)}>Keep PO</Button><Button variant="destructive" disabled={!cancelReason} onClick={async () => { try { await cancel({ id, reason: cancelReason }).unwrap(); toast.success('PO cancelled'); setCancelOpen(false); } catch (err) { toast.error(apiErrorMessage(err)); } }} loading={cancelling}>Cancel PO</Button></>}>
        <Label required>Reason</Label>
        <Textarea rows={3} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Why cancelling?" />
      </Modal>
    </div>
  );
}

function ReceiptModal({ open, onClose, po, onSubmit, loading }) {
  const { register, handleSubmit, watch } = useForm({ defaultValues: { items: po?.items?.map((it) => ({ poItem: it._id, quantity: 0 })) || [] } });
  if (!po) return null;
  return (
    <Modal open={open} onClose={onClose} title="Record receipt" description="Record what arrived in this delivery"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={handleSubmit((v) => onSubmit({ items: v.items.filter((it) => Number(it.quantity) > 0).map((it) => ({ poItem: it.poItem, quantity: Number(it.quantity) })), notes: v.notes }))} loading={loading}>Save receipt</Button></>}>
      <div className="space-y-3">
        {po.items.map((it, idx) => {
          const remaining = it.quantityOrdered - it.quantityReceived;
          return (
            <div key={it._id} className="flex items-center gap-3 border rounded p-3">
              <div className="flex-1">
                <div className="font-medium text-sm">{it.name}</div>
                <div className="text-xs text-muted-foreground">{it.quantityReceived} / {it.quantityOrdered} received · {remaining} remaining</div>
              </div>
              <input type="hidden" {...register(`items.${idx}.poItem`)} value={it._id} />
              <Input type="number" min={0} max={remaining} placeholder="0" className="w-24" {...register(`items.${idx}.quantity`)} />
            </div>
          );
        })}
        <div><Label>Notes</Label><Textarea rows={2} placeholder="Delivery note, condition…" {...register('notes')} /></div>
      </div>
    </Modal>
  );
}

function PaymentModal({ open, onClose, po, onSubmit, loading }) {
  const outstanding = po ? po.grandTotal - po.paidAmount : 0;
  const { register, handleSubmit } = useForm({ defaultValues: { amount: outstanding, method: 'cash', reference: '', notes: '' } });
  return (
    <Modal open={open} onClose={onClose} title="Record payment" description={`Outstanding: ${formatPrice(outstanding)}`}
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={handleSubmit((v) => onSubmit({ amount: Number(v.amount), method: v.method, reference: v.reference, notes: v.notes }))} loading={loading}>Save payment</Button></>}>
      <div className="space-y-3">
        <div><Label required>Amount (Rs)</Label><Input type="number" {...register('amount', { required: true })} /></div>
        <div><Label>Method</Label><Select {...register('method')}>{PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}</Select></div>
        <div><Label>Reference (cheque #, txn id, etc.)</Label><Input {...register('reference')} /></div>
        <div><Label>Notes</Label><Textarea rows={2} {...register('notes')} /></div>
      </div>
    </Modal>
  );
}
