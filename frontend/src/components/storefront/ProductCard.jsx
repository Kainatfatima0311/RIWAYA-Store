import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { useAppSelector } from '@/store/hooks';
import { selectIsAuthenticated } from '@/store/slices/authSlice';
import { useAddToCartMutation } from '@/api/cartApi';
import { useAddToWishlistMutation } from '@/api/wishlistApi';
import { formatPrice } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { ProductImage } from '@/components/storefront/ProductImage';
import { cn } from '@/lib/utils';

export function ProductCard({ product }) {
  const isAuth = useAppSelector(selectIsAuthenticated);
  const [addToCart, { isLoading: adding }] = useAddToCartMutation();
  const [addToWishlist] = useAddToWishlistMutation();

  const img = product.images?.[0]?.url;
  const onSale = product.salePrice > 0 && product.salePrice < product.basePrice;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuth) {
      toast.error('Please sign in to add items to cart');
      return;
    }
    // We need a variant to add to cart — use the first available one (default)
    if (!product.variants?.length) {
      toast.info('Please open the product to choose a variant');
      return;
    }
    try {
      await addToCart({
        product: product._id,
        variantId: product.variants.find((v) => v.isDefault)?._id || product.variants[0]._id,
        quantity: 1,
      }).unwrap();
      toast.success('Added to cart');
    } catch (err) {
      toast.error(err?.data?.message || 'Could not add to cart');
    }
  };

  const handleAddToWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuth) {
      toast.error('Please sign in to use wishlist');
      return;
    }
    try {
      await addToWishlist({ product: product._id }).unwrap();
      toast.success('Added to wishlist');
    } catch (err) {
      toast.error(err?.data?.message || 'Could not add to wishlist');
    }
  };

  return (
    <Link
      to={`/products/${product.slug}`}
      className="group block bg-card rounded-lg overflow-hidden border hover:shadow-lg transition-shadow"
    >
      {/* Image */}
      <div className="relative aspect-[3/4] bg-muted overflow-hidden">
        <ProductImage
          src={img}
          alt={product.name}
          fallbackLabel={product.name}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Tags */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {onSale && <Badge className="bg-primary text-primary-foreground">SALE</Badge>}
          {product.isNew && <Badge className="bg-accent text-accent-foreground">NEW</Badge>}
        </div>

        {/* Quick actions */}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleAddToWishlist}
            className="h-8 w-8 rounded-full bg-background/95 hover:bg-background flex items-center justify-center shadow"
            aria-label="Add to wishlist"
          >
            <Heart className="h-4 w-4" />
          </button>
          <button
            onClick={handleAddToCart}
            disabled={adding}
            className="h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center shadow disabled:opacity-50"
            aria-label="Add to cart"
          >
            <ShoppingBag className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        {product.brand && (
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{product.brand}</div>
        )}
        <h3 className="font-medium text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className={cn('font-semibold', onSale ? 'text-primary' : '')}>
            {formatPrice(onSale ? product.salePrice : product.basePrice, { currency: product.currency })}
          </span>
          {onSale && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(product.basePrice, { currency: product.currency })}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-card rounded-lg overflow-hidden border animate-pulse">
      <div className="aspect-[3/4] bg-muted" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
      </div>
    </div>
  );
}
