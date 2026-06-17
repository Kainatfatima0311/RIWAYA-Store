import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import {
  useGetCartQuery,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
} from '@/api/cartApi';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { PageSpinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatPrice } from '@/lib/format';

export default function Cart() {
  const navigate = useNavigate();
  const { data, isLoading } = useGetCartQuery();
  const [updateItem] = useUpdateCartItemMutation();
  const [removeItem] = useRemoveCartItemMutation();
  const [clearCart, { isLoading: clearing }] = useClearCartMutation();

  if (isLoading) return <PageSpinner label="Loading your cart…" />;

  const cart = data?.data;
  const items = cart?.items || [];
  const subtotal = cart?.subtotal || 0;

  if (!items.length) {
    return (
      <div className="container py-16">
        <EmptyState
          icon={ShoppingCart}
          title="Your cart is empty"
          description="Browse our collection and add your favourite pieces."
          action={<Link to="/products"><Button>Continue shopping</Button></Link>}
        />
      </div>
    );
  }

  const handleQtyChange = async (itemId, quantity) => {
    if (quantity < 1) return;
    try {
      await updateItem({ itemId, quantity }).unwrap();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update');
    }
  };

  const handleRemove = async (itemId) => {
    try {
      await removeItem(itemId).unwrap();
      toast.success('Item removed');
    } catch {
      toast.error('Failed to remove');
    }
  };

  const handleClear = async () => {
    if (!confirm('Empty cart?')) return;
    try { await clearCart().unwrap(); toast.success('Cart emptied'); } catch {/* ignore */}
  };

  // Estimated totals (server will recompute)
  const shippingEstimate = subtotal > 5000 ? 0 : 250;
  const grandEstimate = subtotal + shippingEstimate;

  return (
    <div className="container py-8">
      <div className="flex items-end justify-between mb-6">
        <h1 className="font-serif text-3xl md:text-4xl">Your cart</h1>
        <button onClick={handleClear} disabled={clearing} className="text-sm text-muted-foreground hover:text-destructive">
          Clear cart
        </button>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-8">
        <div className="space-y-3">
          {items.map((item) => {
            const product = item.product;
            const variant = product?.variants?.length
              ? product.variants.find((v) => String(v._id) === String(item.variantId))
              : null;
            const img = product?.images?.[0]?.url;
            const unitPrice = item.priceSnapshot;

            return (
              <Card key={item._id}>
                <CardContent className="p-4 flex gap-4">
                  <Link to={`/products/${product?.slug}`} className="w-24 h-32 bg-muted rounded overflow-hidden flex-shrink-0">
                    {img && <img src={img} alt={product?.name} className="w-full h-full object-cover" />}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/products/${product?.slug}`} className="font-medium line-clamp-2 hover:text-primary">
                      {product?.name}
                    </Link>
                    {variant && (
                      <div className="text-sm text-muted-foreground mt-1">{variant.label}</div>
                    )}
                    <div className="text-sm font-semibold mt-2">{formatPrice(unitPrice)}</div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border rounded-md">
                        <button onClick={() => handleQtyChange(item._id, item.quantity - 1)} className="p-1.5 hover:bg-accent/30">
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="px-3 text-sm">{item.quantity}</span>
                        <button onClick={() => handleQtyChange(item._id, item.quantity + 1)} className="p-1.5 hover:bg-accent/30">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{formatPrice(unitPrice * item.quantity)}</span>
                        <button onClick={() => handleRemove(item._id)} className="text-muted-foreground hover:text-destructive p-1">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <aside>
          <Card className="sticky top-20">
            <CardContent className="pt-6 space-y-4">
              <h2 className="font-semibold text-lg">Order summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items ({cart?.itemCount})</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping {shippingEstimate === 0 && <span className="text-xs text-emerald-600">(free)</span>}</span>
                  <span>{shippingEstimate === 0 ? 'Free' : formatPrice(shippingEstimate)}</span>
                </div>
                {subtotal < 5000 && shippingEstimate > 0 && (
                  <p className="text-xs text-muted-foreground">Spend {formatPrice(5000 - subtotal)} more for free shipping</p>
                )}
                <div className="border-t pt-2 flex justify-between font-semibold text-base">
                  <span>Estimated total</span>
                  <span className="text-primary">{formatPrice(grandEstimate)}</span>
                </div>
              </div>
              <Button className="w-full" onClick={() => navigate('/checkout')}>
                Proceed to checkout <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Link to="/products" className="block text-center text-sm text-muted-foreground hover:text-primary">
                Continue shopping
              </Link>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
