import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Truck, XCircle, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import {
  useGetOrderQuery,
  useTransitionOrderMutation,
  useCancelOrderMutation,
  useUpdateCourierMutation,
} from '@/api/orderApi';
import { usePaymentsForOrderQuery, useRecordPaymentMutation } from '@/api/peopleApi';
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
import { StatusTimeline } from '@/components/storefront/StatusTimeline';
import { formatPrice, formatDate, formatDateTime } from '@/lib/format';
import { apiErrorMessage } from '@/lib/apiError';

const NEXT_STATUS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['packed', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  shipped: ['out_for_delivery', 'delivered', 'returned'],
  out_for_delivery: ['delivered', 'returned'],
  delivered: ['returned'],
  returned: ['refunded'],
};

const PAYMENT_METHODS = ['cash', 'cod', 'stripe', 'jazzcash', 'easypaisa', 'bank_transfer', 'cheque', 'card', 'other'];

export default function OrderDetail() {
  const { id } = useParams();
  const { data, isLoading } = useGetOrderQuery(id);
  const { data: paymentsData } = usePaymentsForOrderQuery(id, { skip: !id });

  const [transition, { isLoading: transitioning }] = useTransitionOrderMutation();
  const [cancel, { isLoading: cancelling }] = useCancelOrderMutation();
  const [updateCourier, { isLoading: updatingCourier }] = useUpdateCourierMutation();
  const [recordPayment, { isLoading: paying }] = useRecordPaymentMutation();

  const [courierOpen, setCourierOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [downloading, setDownloading] = useState(false);

  if (isLoading) return <PageSpinner label="Loading order…" />;
  const o = data?.data;
  if (!o) return <p>Order not found</p>;

  const payments = paymentsData?.data || [];
  const nextStatuses = NEXT_STATUS[o.status] || [];

  const handleInvoice = async () => {
    setDownloading(true);
    try {
      const { downloadOrderInvoice } = await import('@/lib/pdf');
      downloadOrderInvoice(o);
    } catch {
      toast.error('Could not generate invoice');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      <Link to="/admin/orders" className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 mb-4">
        <ArrowLeft className="h-4 w-4" /> All orders
      </Link>

      <div className="animate-fade-up">
      <PageHeader
        title={o.orderNumber}
        description={`${o.orderType === 'online' ? 'Online' : 'Walk-in'} order · placed ${formatDateTime(o.orderedAt)}`}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleInvoice} loading={downloading} aria-label="Download invoice">
              <FileDown className="h-4 w-4 mr-1" /> Invoice
            </Button>
            {nextStatuses.map((s) => (
              s !== 'cancelled' && (
                <Button
                  key={s}
                  variant={s === 'delivered' ? 'default' : 'outline'}
                  size="sm"
                  onClick={async () => { try { await transition({ id, status: s }).unwrap(); toast.success(`Moved to ${s.replace(/_/g, ' ')}`); } catch (err) { toast.error(apiErrorMessage(err)); } }}
                  loading={transitioning}
                >
                  Mark as {s.replace(/_/g, ' ')}
                </Button>
              )
            ))}
            {['shipped', 'out_for_delivery'].includes(o.status) && (
              <Button variant="outline" size="sm" onClick={() => setCourierOpen(true)}><Truck className="h-4 w-4 mr-1" /> Courier</Button>
            )}
            {o.paymentStatus !== 'paid' && o.status !== 'cancelled' && (
              <Button variant="outline" size="sm" onClick={() => setPaymentOpen(true)}>Record payment</Button>
            )}
            {nextStatuses.includes('cancelled') && (
              <Button variant="destructive" size="sm" onClick={() => setCancelOpen(true)}><XCircle className="h-4 w-4 mr-1" /> Cancel</Button>
            )}
          </div>
        }
      />
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-4">
          <Reveal animation="fade-up-sm" className="flex flex-wrap gap-2">
            <Badge status={o.status}>{o.status.replace(/_/g, ' ')}</Badge>
            <Badge status={o.paymentStatus}>{o.paymentStatus.replace(/_/g, ' ')}</Badge>
          </Reveal>

          <Reveal animation="fade-up" delay={60}>
            <StatusTimeline order={o} />
          </Reveal>

          <Reveal animation="fade-up" delay={120}>
          <Card>
            <CardContent className="pt-6">
              <h2 className="font-semibold mb-3">Items ({o.items.length})</h2>
              <Stagger as="ul" childAs="li" step={60} maxDelay={400} className="space-y-2">
                {o.items.map((it) => (
                  <div key={it._id} className="flex gap-3 border rounded p-3 hover-lift-sm">
                    <div className="w-12 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
                      {it.productImage && <img src={it.productImage} alt="" className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm line-clamp-1">{it.productName}</div>
                      <div className="text-xs text-muted-foreground">{it.variantLabel} · SKU {it.productSku}</div>
                      <div className="text-xs text-muted-foreground mt-1">{it.quantity} × {formatPrice(it.unitPrice)}</div>
                    </div>
                    <div className="font-semibold">{formatPrice(it.totalPrice)}</div>
                  </div>
                ))}
              </Stagger>
            </CardContent>
          </Card>
          </Reveal>

          {payments.length > 0 && (
            <Reveal animation="fade-up" delay={180}>
            <Card>
              <CardContent className="pt-6">
                <h2 className="font-semibold mb-3">Payments ({payments.length})</h2>
                <Stagger as="ul" childAs="li" step={60} maxDelay={400} className="space-y-2 text-sm">
                  {payments.map((p) => (
                    <div key={p._id} className="border rounded p-3 flex items-center justify-between hover-lift-sm">
                      <div>
                        <div className="font-medium">{formatPrice(p.amount)} via {p.method?.replace(/_/g, ' ')}</div>
                        <div className="text-xs text-muted-foreground">{formatDateTime(p.paidAt)}</div>
                      </div>
                      <Badge status={p.status}>{p.status}</Badge>
                    </div>
                  ))}
                </Stagger>
              </CardContent>
            </Card>
            </Reveal>
          )}

          {o.courier?.trackingNumber && (
            <Reveal animation="fade-up" delay={240}>
            <Card>
              <CardContent className="pt-6">
                <h2 className="font-semibold mb-3">Courier</h2>
                <p className="text-sm">{o.courier.name} — {o.courier.trackingNumber}</p>
                {o.estimatedDelivery && <p className="text-sm text-muted-foreground mt-1">ETA: {formatDate(o.estimatedDelivery)}</p>}
              </CardContent>
            </Card>
            </Reveal>
          )}
        </div>

        <aside className="space-y-4">
          <Reveal animation="fade-up-sm" delay={60}>
          <Card className="hover-lift">
            <CardContent className="pt-6 space-y-2 text-sm">
              <h3 className="font-semibold">Customer</h3>
              <div className="font-medium">{o.customer?.name}</div>
              <div className="text-muted-foreground">{o.customer?.email}</div>
              <div className="text-muted-foreground">{o.customer?.phone}</div>
            </CardContent>
          </Card>
          </Reveal>

          {o.shippingAddress && (
            <Reveal animation="fade-up-sm" delay={120}>
            <Card className="hover-lift">
              <CardContent className="pt-6 space-y-1 text-sm">
                <h3 className="font-semibold mb-2">Shipping address</h3>
                <div>{o.shippingAddress.fullName}</div>
                <div>{o.shippingAddress.phone}</div>
                <div className="text-muted-foreground">{o.shippingAddress.line1}{o.shippingAddress.line2 ? `, ${o.shippingAddress.line2}` : ''}, {o.shippingAddress.city}{o.shippingAddress.province ? `, ${o.shippingAddress.province}` : ''}</div>
              </CardContent>
            </Card>
            </Reveal>
          )}

          <Reveal animation="fade-up-sm" delay={180}>
          <Card className="hover-lift">
            <CardContent className="pt-6 space-y-2 text-sm">
              <h3 className="font-semibold">Totals</h3>
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(o.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{formatPrice(o.taxAmount)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{formatPrice(o.shippingFee)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>-{formatPrice(o.discount)}</span></div>
              <div className="flex justify-between font-semibold text-base pt-2 border-t"><span>Total</span><span className="text-primary"><CountUp value={o.grandTotal} format={formatPrice} /></span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span><CountUp value={o.paidAmount} format={formatPrice} /></span></div>
            </CardContent>
          </Card>
          </Reveal>
        </aside>
      </div>

      <CourierModal open={courierOpen} onClose={() => setCourierOpen(false)} order={o} onSubmit={async (v) => { try { await updateCourier({ id, ...v }).unwrap(); toast.success('Updated'); setCourierOpen(false); } catch (err) { toast.error(apiErrorMessage(err)); } }} loading={updatingCourier} />

      <PaymentModal open={paymentOpen} onClose={() => setPaymentOpen(false)} order={o} onSubmit={async (v) => { try { await recordPayment({ order: id, ...v }).unwrap(); toast.success('Payment recorded'); setPaymentOpen(false); } catch (err) { toast.error(apiErrorMessage(err)); } }} loading={paying} />

      <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} title="Cancel order?"
        footer={<><Button variant="outline" onClick={() => setCancelOpen(false)}>Keep order</Button><Button variant="destructive" disabled={!cancelReason} onClick={async () => { try { await cancel({ id, reason: cancelReason }).unwrap(); toast.success('Cancelled'); setCancelOpen(false); } catch (err) { toast.error(apiErrorMessage(err)); } }} loading={cancelling}>Cancel order</Button></>}>
        <Label required>Reason</Label>
        <Textarea rows={3} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
      </Modal>
    </div>
  );
}

function CourierModal({ open, onClose, order, onSubmit, loading }) {
  const { register, handleSubmit } = useForm({ defaultValues: { name: order?.courier?.name || '', trackingNumber: order?.courier?.trackingNumber || '', trackingUrl: order?.courier?.trackingUrl || '' } });
  return (
    <Modal open={open} onClose={onClose} title="Courier details"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={handleSubmit(onSubmit)} loading={loading}>Save</Button></>}>
      <div className="space-y-3">
        <div><Label>Courier name</Label><Input {...register('name')} placeholder="TCS, Leopards, M&P, BlueEx…" /></div>
        <div><Label>Tracking number</Label><Input {...register('trackingNumber')} /></div>
        <div><Label>Tracking URL</Label><Input {...register('trackingUrl')} placeholder="https://…" /></div>
      </div>
    </Modal>
  );
}

function PaymentModal({ open, onClose, order, onSubmit, loading }) {
  const outstanding = order ? order.grandTotal - order.paidAmount : 0;
  const { register, handleSubmit } = useForm({ defaultValues: { amount: outstanding, method: 'cash' } });
  return (
    <Modal open={open} onClose={onClose} title="Record payment" description={`Outstanding: ${formatPrice(outstanding)}`}
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={handleSubmit((v) => onSubmit({ amount: Number(v.amount), method: v.method, referenceNumber: v.reference, notes: v.notes }))} loading={loading}>Save</Button></>}>
      <div className="space-y-3">
        <div><Label required>Amount (Rs)</Label><Input type="number" {...register('amount', { required: true })} /></div>
        <div><Label>Method</Label><Select {...register('method')}>{PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}</Select></div>
        <div><Label>Reference</Label><Input {...register('reference')} placeholder="Txn ID, cheque #" /></div>
        <div><Label>Notes</Label><Textarea rows={2} {...register('notes')} /></div>
      </div>
    </Modal>
  );
}
