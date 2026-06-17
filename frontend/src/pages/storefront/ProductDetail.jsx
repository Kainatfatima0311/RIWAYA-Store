import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Heart, ShoppingBag, Minus, Plus, ArrowLeft, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useStorefrontProductBySlugQuery } from '@/api/productApi';
import { useAddToCartMutation } from '@/api/cartApi';
import { useAddToWishlistMutation, useCheckInWishlistQuery } from '@/api/wishlistApi';
import { useAppSelector } from '@/store/hooks';
import { selectIsAuthenticated } from '@/store/slices/authSlice';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageSpinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProductImage } from '@/components/storefront/ProductImage';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const isAuth = useAppSelector(selectIsAuthenticated);
  const { data, isLoading, isError } = useStorefrontProductBySlugQuery(slug);
  const product = data?.data;

  const [variantId, setVariantId] = useState(null);
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);

  const [addToCart, { isLoading: adding }] = useAddToCartMutation();
  const [addToWishlist, { isLoading: wishing }] = useAddToWishlistMutation();
  const { data: wlCheck } = useCheckInWishlistQuery(product?._id, { skip: !product?._id || !isAuth });

  if (isLoading) return <PageSpinner label="Loading product…" />;
  if (isError || !product) {
    return (
      <div className="container py-16">
        <EmptyState title="Product not found" description="The product you're looking for doesn't exist or has been removed." action={<Link to="/products"><Button variant="outline">Back to shop</Button></Link>} />
      </div>
    );
  }

  const selectedVariant = product.variants.find((v) => v._id === variantId) || product.variants.find((v) => v.isDefault) || product.variants[0];
  const onSale = product.salePrice > 0 && product.salePrice < product.basePrice;
  const effectivePrice = (onSale ? product.salePrice : product.basePrice) + (selectedVariant?.additionalPrice || 0);
  const images = product.images?.length ? product.images : [];
  const stockItem = selectedVariant?.stockItem;
  const availableQty = stockItem ? Math.max(0, (stockItem.totalQuantity || 0) - (stockItem.reservedQuantity || 0)) : 0;
  const inWishlist = wlCheck?.data?.inWishlist;

  const handleAddToCart = async () => {
    if (!isAuth) { toast.error('Please sign in to add items to cart'); navigate('/login'); return; }
    try {
      await addToCart({ product: product._id, variantId: selectedVariant._id, quantity: qty }).unwrap();
      toast.success('Added to cart');
    } catch (err) { toast.error(err?.data?.message || 'Could not add to cart'); }
  };

  const handleAddToWishlist = async () => {
    if (!isAuth) { toast.error('Please sign in to use wishlist'); navigate('/login'); return; }
    try {
      await addToWishlist({ product: product._id }).unwrap();
      toast.success(inWishlist ? 'Already in wishlist' : 'Added to wishlist');
    } catch (err) { toast.error(err?.data?.message || 'Could not add to wishlist'); }
  };

  return (
    <div className="container py-8">
      <Link to="/products" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to shop
      </Link>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        <div>
          <div className="aspect-[3/4] bg-muted rounded-lg overflow-hidden">
            <ProductImage
              src={images[imgIdx]?.url}
              alt={product.name}
              fallbackLabel={product.name}
              className="h-full w-full object-cover"
            />
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-5 gap-2 mt-3">
              {images.map((img, i) => (
                <button
                  key={img._id || i}
                  onClick={() => setImgIdx(i)}
                  className={cn('aspect-square rounded overflow-hidden border-2', i === imgIdx ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100')}
                >
                  <ProductImage src={img.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {product.brand && <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{product.brand}</div>}
          <h1 className="font-serif text-3xl md:text-4xl mb-3">{product.name}</h1>

          {product.categories?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {product.categories.map((c) => (
                <Badge key={c._id || c} variant="outline">{c.name || 'Category'}</Badge>
              ))}
            </div>
          )}

          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-3xl font-semibold text-primary">{formatPrice(effectivePrice, { currency: product.currency })}</span>
            {onSale && (
              <>
                <span className="text-lg text-muted-foreground line-through">{formatPrice(product.basePrice + (selectedVariant?.additionalPrice || 0), { currency: product.currency })}</span>
                <Badge className="bg-primary text-primary-foreground">-{Math.round(((product.basePrice - product.salePrice) / product.basePrice) * 100)}%</Badge>
              </>
            )}
          </div>

          {product.shortDescription && <p className="text-muted-foreground mb-6">{product.shortDescription}</p>}

          {product.variants?.length > 1 && (
            <div className="mb-6">
              <div className="text-sm font-medium mb-2">Choose variant</div>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v._id}
                    onClick={() => setVariantId(v._id)}
                    className={cn(
                      'px-3 py-2 rounded-md border text-sm transition-colors',
                      (v._id === (variantId || selectedVariant?._id))
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'hover:border-primary'
                    )}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="text-sm mb-6">
            {availableQty > 10 && <span className="text-emerald-600">In stock</span>}
            {availableQty > 0 && availableQty <= 10 && <span className="text-amber-600">Only {availableQty} left</span>}
            {availableQty <= 0 && <span className="text-destructive">Out of stock</span>}
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center border rounded-md">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-2 hover:bg-accent/30"><Minus className="h-4 w-4" /></button>
              <span className="px-4 font-medium">{qty}</span>
              <button onClick={() => setQty((q) => Math.min(availableQty || 100, q + 1))} className="p-2 hover:bg-accent/30"><Plus className="h-4 w-4" /></button>
            </div>
            <Button onClick={handleAddToCart} loading={adding} disabled={availableQty <= 0} className="flex-1">
              <ShoppingBag className="h-4 w-4 mr-2" /> Add to cart
            </Button>
            <Button variant="outline" onClick={handleAddToWishlist} loading={wishing}>
              {inWishlist ? <Check className="h-4 w-4" /> : <Heart className="h-4 w-4" />}
            </Button>
          </div>

          {product.description && (
            <div className="border-t pt-6 mt-6">
              <h2 className="font-semibold mb-2">Description</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{product.description}</p>
            </div>
          )}

          {product.specifications?.length > 0 && (
            <div className="border-t pt-6 mt-6">
              <h2 className="font-semibold mb-3">Specifications</h2>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                {product.specifications.map((s, i) => (
                  <div key={i} className="contents">
                    <dt className="text-muted-foreground">{s.label}</dt>
                    <dd>{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
