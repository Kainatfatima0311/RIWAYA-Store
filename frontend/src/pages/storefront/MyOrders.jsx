import { Link } from 'react-router-dom';
import { ShoppingBag, ChevronRight } from 'lucide-react';
import { useMyOrdersQuery } from '@/api/orderApi';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatPrice, formatDate } from '@/lib/format';

export default function MyOrders() {
  const { data, isLoading } = useMyOrdersQuery({ page: 1, limit: 50 });

  if (isLoading) return <PageSpinner label="Loading your orders…" />;

  const orders = data?.data || [];

  if (!orders.length) {
    return (
      <div className="container py-16">
        <EmptyState
          icon={ShoppingBag}
          title="No orders yet"
          description="Your purchase history will appear here."
          action={<Link to="/products"><Button>Start shopping</Button></Link>}
        />
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl">
      <h1 className="font-serif text-3xl md:text-4xl mb-6">My Orders</h1>
      <div className="space-y-3">
        {orders.map((order) => (
          <Link key={order._id} to={`/track/${order.orderNumber}`}>
            <Card className="hover:border-primary transition-colors">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                    <span className="font-semibold text-primary">{order.orderNumber}</span>
                    <Badge status={order.status}>{order.status.replace(/_/g, ' ')}</Badge>
                    {order.hasPendingPayment ? (
                      <Badge className="bg-amber-100 text-amber-900">payment pending verification</Badge>
                    ) : (
                      <Badge status={order.paymentStatus}>{order.paymentStatus}</Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(order.orderedAt)} · {order.items?.length || 0} items
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatPrice(order.grandTotal)}</div>
                  <div className="text-xs text-muted-foreground capitalize">{order.orderType}</div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
