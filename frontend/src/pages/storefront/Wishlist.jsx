import { Link } from 'react-router-dom';
import { Heart, Trash2, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import {
  useGetWishlistQuery,
  useRemoveWishlistItemMutation,
  useClearWishlistMutation,
} from '@/api/wishlistApi';
import { useAddToCartMutation } from '@/api/cartApi';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { PageSpinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatPrice } from '@/lib/format';

export default function Wishlist() {
  const { data, isLoading } = useGetWishlistQuery();
  const [removeItem] = useRemoveWishlistItemMutation();
  const [clearWishlist] = useClearWishlistMutation();
  const [addToCart] = useAddToCartMutation();

  if (isLoading) return <PageSpinner label="Loading wishlist…" />;

  const items = data?.data?.items || [];

  if (!items.length) {
    return (
      <div className="container py-16">
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Save items you love to find them easily later."
          action={<Link to="/products"><Button>Explore products</Button></Link>}
        />
      </div>
    );
  }

  const handleRemove = async (id) => {
    try { await removeItem(id).unwrap(); toast.success('Removed'); } catch { toast.error('Failed'); }
  };

  const handleMoveToCart = async (product) => {
    if (!product?.variants?.length || product.status !== 'published') {
      toast.error('Product unavailable');
      return;
    }
    try {
      // Use first variant from product detail — wishlist items don't carry variants
      const detail = product;
      const firstVariant = detail.variants?.find((v) => v.isDefault) || detail.variants?.[0];
      if (!firstVariant) {
        toast.info('Open product to choose variant');
        return;
      }
      await addToCart({ product: detail._id, variantId: firstVariant._id, quantity: 1 }).unwrap();
      toast.success('Added to cart');
    } catch (err) {
      toast.error(err?.data?.message || 'Could not move to cart');
    }
  };

  const handleClear = async () => {
    if (!confirm('Clear wishlist?')) return;
    try { await clearWishlist().unwrap(); toast.success('Wishlist cleared'); } catch {/* ignore */}
  };

  return (
    <div className="container py-8">
      <div className="flex items-end justify-between mb-6">
        <h1 className="font-serif text-3xl md:text-4xl">Your wishlist</h1>
        <button onClick={handleClear} className="text-sm text-muted-foreground hover:text-destructive">Clear all</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item) => {
          const p = item.product;
          if (!p) return null;
          const img = p.images?.[0]?.url;
          const onSale = p.salePrice > 0 && p.salePrice < p.basePrice;
          return (
            <Card key={item._id} className="overflow-hidden">
              <Link to={`/products/${p.slug}`}>
                <div className="aspect-[3/4] bg-muted">
                  {img && <img src={img} alt={p.name} className="w-full h-full object-cover" />}
                </div>
              </Link>
              <CardContent className="p-3">
                <Link to={`/products/${p.slug}`} className="font-medium text-sm line-clamp-2 hover:text-primary">{p.name}</Link>
                <div className="mt-1 font-semibold text-sm">{formatPrice(onSale ? p.salePrice : p.basePrice)}</div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => handleMoveToCart(p)}>
                    <ShoppingBag className="h-3.5 w-3.5 mr-1" /> Add
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleRemove(item._id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
