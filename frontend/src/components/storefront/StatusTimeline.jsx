import { Check, Package, Truck, ShoppingBag, XCircle, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/format';
import { Reveal } from '@/components/ui/Reveal';

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
            'h-12 w-12 rounded-full flex items-center justify-center animate-scale-in',
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
            <Reveal
              as="li"
              key={step.key}
              delay={Math.min(idx * 60, 400)}
              className="flex gap-4"
            >
              <div className="relative flex flex-col items-center">
                <div className="relative">
                  {isCurrent && (
                    <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping" aria-hidden="true" />
                  )}
                  <div
                    className={cn(
                      'relative h-9 w-9 rounded-full flex items-center justify-center border-2 transition-all duration-300',
                      isCompleted
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'bg-background border-border text-muted-foreground',
                      isCurrent && 'shadow-md'
                    )}
                  >
                    <step.icon className="h-4 w-4" />
                  </div>
                </div>
                {idx < FLOW.length - 1 && (
                  <div className="relative w-0.5 flex-1 min-h-[24px] mt-1 bg-border overflow-hidden">
                    <div
                      className="absolute inset-0 origin-top bg-primary transition-transform duration-700 ease-out"
                      style={{ transform: `scaleY(${isCompleted && idx < currentIdx ? 1 : 0})` }}
                      aria-hidden="true"
                    />
                  </div>
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
            </Reveal>
          );
        })}
      </ol>
    </div>
  );
}
