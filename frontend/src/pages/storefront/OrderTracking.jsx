import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Search, Package, MapPin, Truck, Clock } from 'lucide-react';
import { useTrackOrderQuery } from '@/api/orderApi';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageSpinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusTimeline } from '@/components/storefront/StatusTimeline';
import { formatDate } from '@/lib/format';

export default function OrderTracking() {
  const { orderNumber: paramNumber } = useParams();
  const [orderNumber, setOrderNumber] = useState(paramNumber || '');
  const navigate = useNavigate();

  const { data, isLoading, isError } = useTrackOrderQuery(paramNumber, { skip: !paramNumber });

  return (
    <div className="container py-8 max-w-3xl">
      <h1 className="font-serif text-3xl md:text-4xl mb-6">Track your order</h1>

      <form
        onSubmit={(e) => { e.preventDefault(); if (orderNumber) navigate(`/track/${orderNumber.trim().toUpperCase()}`); }}
        className="flex gap-2 mb-8"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="e.g. ORD-2026-00001"
            className="pl-9 uppercase"
          />
        </div>
        <Button type="submit">Track</Button>
      </form>

      {!paramNumber && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Enter your order number above to see live status.
        </p>
      )}

      {paramNumber && isLoading && <PageSpinner label="Fetching order…" />}

      {paramNumber && isError && (
        <EmptyState
          icon={Package}
          title="Order not found"
          description="Please check the order number and try again."
        />
      )}

      {paramNumber && data?.data && (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm text-muted-foreground">Order</div>
                <div className="font-semibold text-primary text-lg">{data.data.orderNumber}</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge status={data.data.status}>{data.data.status.replace(/_/g, ' ')}</Badge>
                {data.data.hasPendingPayment ? (
                  <Badge className="bg-amber-100 text-amber-900">payment pending verification</Badge>
                ) : (
                  <Badge status={data.data.paymentStatus}>{data.data.paymentStatus}</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment verification notice */}
          {data.data.hasPendingPayment && (
            <Card className="border-amber-200 bg-amber-50/60">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div className="flex-1 text-sm">
                    <div className="font-semibold text-amber-900">Payment under verification</div>
                    <p className="text-amber-800 mt-1">
                      We've received your payment details via <strong>{data.data.pendingPayment?.method?.replace(/_/g, ' ')}</strong>
                      {data.data.pendingPayment?.transactionId && (
                        <> with reference <span className="font-mono">{data.data.pendingPayment.transactionId}</span></>
                      )}.
                      Our team will confirm within 24 hours. Order processing starts after approval.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <StatusTimeline order={data.data} />

          {data.data.courier?.trackingNumber && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Truck className="h-6 w-6 text-primary" />
                  <div className="flex-1">
                    <div className="font-semibold text-sm">Shipped via {data.data.courier.name || 'Courier'}</div>
                    <div className="text-sm text-muted-foreground">Tracking #: {data.data.courier.trackingNumber}</div>
                  </div>
                  {data.data.courier.trackingUrl && (
                    <a
                      href={data.data.courier.trackingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-primary font-medium"
                    >
                      View on courier →
                    </a>
                  )}
                </div>
                {data.data.estimatedDelivery && (
                  <div className="text-sm text-muted-foreground mt-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Estimated delivery: {formatDate(data.data.estimatedDelivery)}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="text-center pt-4">
            <Link to="/orders" className="text-sm text-primary font-medium">View all my orders →</Link>
          </div>
        </div>
      )}
    </div>
  );
}
