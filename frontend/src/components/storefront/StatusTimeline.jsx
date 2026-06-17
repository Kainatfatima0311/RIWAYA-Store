import { Check, Package, Truck, ShoppingBag, XCircle, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/format';

const FLOW = [
  { key: 'pending', label: 'Order placed', icon: ShoppingBag },
  { key: 'confirmed', label: 'Confirmed', icon: Check },
  { key: 'packed', label: 'Packed', icon: Package },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'out_for_delivery', label: 'Out for delivery', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: Check },
];

const TERMINAL_STYLES = {
  cancelled: { icon: XCircle, label: 'Cancelled', tone: 'destructive' },
  returned: { icon: RotateCcw, label: 'Returned', tone: 'warn' },
  refunded: { icon: RotateCcw, label: 'Refunded', tone: 'warn' },
};

export function StatusTimeline({ order }) {
  const currentStatus = order?.status;
  const history = order?.statusHistory || [];

  // Map status → timestamp from history
  const stampFor = (status) => {
    const entry = history.find((h) => h.status === status);
    return entry?.changedAt;
  };

  if (TERMINAL_STYLES[currentStatus]) {
    const T = TERMINAL_STYLES[currentStatus];
    return (
      <div className="border rounded-lg p-6 bg-card">
        <div className="flex items-center gap-3">
          <div className={cn(
            'h-12 w-12 rounded-full flex items-center justify-center',
            T.tone === 'destructive' ? 'bg-destructive/10 text-destructive' : 'bg-amber-100 text-amber-900'
          )}>
            <T.icon className="h-6 w-6" />
          </div>
          <div>
            <div className="font-semibold">{T.label}</div>
            <div className="text-sm text-muted-foreground">{formatDateTime(stampFor(currentStatus))}</div>
          </div>
        </div>
        {order.cancelReason && (
          <p className="text-sm text-muted-foreground mt-3">Reason: {order.cancelReason}</p>
        )}
        {order.returnReason && (
          <p className="text-sm text-muted-foreground mt-3">Reason: {order.returnReason}</p>
        )}
      </div>
    );
  }

  const currentIdx = FLOW.findIndex((s) => s.key === currentStatus);

  return (
    <div className="border rounded-lg p-6 bg-card">
      <ol className="space-y-4">
        {FLOW.map((step, idx) => {
          const isCompleted = idx <= currentIdx;
          const isCurrent = idx === currentIdx;
          const stamp = stampFor(step.key);
          return (
            <li key={step.key} className="flex gap-4">
              <div className="relative flex flex-col items-center">
                <div
                  className={cn(
                    'h-9 w-9 rounded-full flex items-center justify-center border-2 transition-colors',
                    isCompleted
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'bg-background border-border text-muted-foreground'
                  )}
                >
                  <step.icon className="h-4 w-4" />
                </div>
                {idx < FLOW.length - 1 && (
                  <div className={cn('w-0.5 flex-1 min-h-[24px] mt-1', isCompleted && idx < currentIdx ? 'bg-primary' : 'bg-border')} />
                )}
              </div>
              <div className="pb-4">
                <div className={cn('font-medium text-sm', isCurrent && 'text-primary')}>{step.label}</div>
                {stamp ? (
                  <div className="text-xs text-muted-foreground">{formatDateTime(stamp)}</div>
                ) : (
                  <div className="text-xs text-muted-foreground">Pending</div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
