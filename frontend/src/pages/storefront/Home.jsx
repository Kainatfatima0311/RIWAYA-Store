import { Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, Truck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useStorefrontFeaturedQuery, useStorefrontCategoriesQuery } from '@/api/productApi';
import { ProductCard, ProductCardSkeleton } from '@/components/storefront/ProductCard';

export default function Home() {
  const { data: featured, isLoading: loadingFeatured } = useStorefrontFeaturedQuery(8);
  const { data: categories } = useStorefrontCategoriesQuery();

  return (
    <div>
      <section className="relative bg-gradient-to-br from-primary/10 via-accent/10 to-background py-20 md:py-28">
        <div className="container text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-primary mb-4">A timeless tradition</p>
          <h1 className="font-serif text-5xl md:text-7xl text-balance leading-tight">
            Crafted in heritage,<br />
            <span className="text-primary">worn with pride.</span>
          </h1>
          <p className="mt-6 text-muted-foreground max-w-xl mx-auto">
            RIWAYA brings you the finest embroidered, bridal, and formal wear — designed with grace, made for unforgettable moments.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/products"><Button size="lg">Shop the collection</Button></Link>
            <Link to="/about"><Button size="lg" variant="outline">Our story</Button></Link>
          </div>
        </div>
      </section>

      <section className="container py-16 grid md:grid-cols-3 gap-8">
        {[
          { icon: Sparkles, title: 'Hand-crafted embroidery', desc: 'Each piece is a labour of love by skilled artisans.' },
          { icon: ShieldCheck, title: 'Premium fabrics', desc: 'Lawn, silk, chiffon — sourced for comfort and elegance.' },
          { icon: Truck, title: 'Fast nationwide delivery', desc: 'Cash on delivery and online payment available.' },
        ].map((v) => (
          <div key={v.title} className="text-center p-6">
            <v.icon className="h-10 w-10 mx-auto text-primary mb-3" />
            <h3 className="font-semibold mb-1">{v.title}</h3>
            <p className="text-sm text-muted-foreground">{v.desc}</p>
          </div>
        ))}
      </section>

      {categories?.data?.length > 0 && (
        <section className="container py-12 border-t">
          <div className="text-center mb-8">
            <h2 className="font-serif text-3xl md:text-4xl">Shop by Category</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.data.slice(0, 8).map((cat) => (
              <Link
                key={cat._id}
                to={`/products?category=${cat._id}`}
                className="group relative aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-accent/30 flex items-center justify-center text-center p-4 hover:shadow-lg transition-shadow"
              >
                <div>
                  <div className="font-serif text-xl text-primary">{cat.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{cat.productCount || 0} items</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="container py-16 border-t">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-serif text-3xl md:text-4xl">Featured Pieces</h2>
            <p className="text-muted-foreground mt-1">Hand-picked for the season</p>
          </div>
          <Link to="/products" className="text-sm font-medium text-primary inline-flex items-center gap-1 hover:gap-2 transition-all">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loadingFeatured ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : featured?.data?.length ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {featured.data.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-12">No featured products yet. Mark some products as Featured in the admin panel.</p>
        )}
      </section>
    </div>
  );
}
