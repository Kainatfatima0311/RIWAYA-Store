import { Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, Truck, ArrowRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { useStorefrontFeaturedQuery, useStorefrontCategoriesQuery } from '@/api/productApi';
import { ProductCard, ProductCardSkeleton } from '@/components/storefront/ProductCard';
import { spotlightMove } from '@/lib/spotlight';
// Imported (not a /public path) so Vite bundles it with a content-hashed filename —
// guaranteed to resolve on Vercel regardless of base path.
import heroImg from '@/assets/hero5.jpeg';

export default function Home() {
  const { data: featured, isLoading: loadingFeatured } = useStorefrontFeaturedQuery(8);
  const { data: categories } = useStorefrontCategoriesQuery();

  return (
    <div>
      <section className="relative isolate overflow-hidden bg-neutral-900 min-h-[calc(100vh-4rem)] flex items-center py-20">
        {/* Hero background photo with a very slow, cinematic Ken-Burns zoom
            (ambient only — no mouse-move parallax). */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <img
            src={heroImg}
            alt=""
            aria-hidden="true"
            fetchpriority="high"
            className="h-full w-full object-cover object-top animate-kenburns will-change-transform"
          />
        </div>
        {/* Readability overlay so the headline stays legible over the photo */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/45 to-black/40" />

        {/* Floating gold glow orbs — gentle ambient drift (not mouse-driven).
            pointer-events-none so they never block interaction. */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
          <div className="absolute top-1/4 -left-16 h-72 w-72 rounded-full bg-primary/30 blur-3xl animate-float" />
          <div className="absolute bottom-12 right-0 h-80 w-80 rounded-full bg-accent/25 blur-3xl animate-float [animation-delay:1.5s]" />
          <div className="absolute top-8 right-1/4 h-56 w-56 rounded-full bg-primary/20 blur-3xl animate-float [animation-delay:3s]" />
          {/* Ambient light sweep */}
          <div className="absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-sheen" />
        </div>

        <div className="container text-center text-white">
          <div className="mx-auto max-w-3xl animate-fade-up">
            <p className="text-sm uppercase tracking-[0.3em] text-white/80 mb-4 drop-shadow">A timeless tradition</p>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-7xl text-balance leading-tight drop-shadow-lg">
              Crafted in heritage,<br />
              <span className="text-accent">worn with pride.</span>
            </h1>
            <p className="mt-6 text-white/85 max-w-xl mx-auto drop-shadow-md">
              RIWAYA brings you the finest embroidered, bridal, and formal wear — designed with grace, made for unforgettable moments.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {/* Primary CTA — gold glow + light sweep on hover + arrow slide */}
              <Link to="/products" className="group">
                <Button size="lg" className="relative overflow-hidden shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.03]">
                  <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  <span className="relative">Shop the collection</span>
                  <ArrowRight className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </Link>
              {/* Secondary CTA — fills on hover */}
              <Link to="/about" className="group">
                <Button size="lg" variant="outline" className="bg-transparent text-white border-white/40 hover:bg-white hover:text-foreground transition-all hover:scale-[1.03]">
                  Our story
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll cue — gentle float (calmer than a bounce loop) */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/60 animate-float" aria-hidden="true">
          <ChevronDown className="h-6 w-6" />
        </div>
      </section>

      <section className="container py-16 grid sm:grid-cols-2 md:grid-cols-3 gap-6">
        {[
          { icon: Sparkles, title: 'Hand-crafted embroidery', desc: 'Each piece is a labour of love by skilled artisans.' },
          { icon: ShieldCheck, title: 'Premium fabrics', desc: 'Lawn, silk, chiffon — sourced for comfort and elegance.' },
          { icon: Truck, title: 'Fast nationwide delivery', desc: 'Cash on delivery and online payment available.' },
        ].map((v, i) => (
          <Reveal key={v.title} delay={i * 90} animation="fade-up-sm">
            <div
              onMouseMove={spotlightMove}
              className="group relative h-full overflow-hidden rounded-2xl border bg-card p-8 text-center shadow-sm glow-gold transition-all duration-300 ease-out hover:-translate-y-1 hover:border-primary/40"
            >
              {/* cursor-following warm gold light wash on hover */}
              <span aria-hidden="true" className="spotlight pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              {/* top accent line */}
              <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative z-10">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/15">
                  <v.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-serif text-xl mb-2">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </section>

      {categories?.data?.length > 0 && (
        <section className="container py-12 border-t">
          <Reveal animation="fade-up" className="text-center mb-8">
            <h2 className="font-serif text-3xl md:text-4xl">Shop by Category</h2>
          </Reveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.data.slice(0, 8).map((cat, i) => {
              const hasImage = !!cat.image?.url;
              return (
                <Reveal key={cat._id} delay={Math.min(i * 60, 400)}>
                <Link
                  to={`/products?category=${cat._id}`}
                  onMouseMove={spotlightMove}
                  className="group relative aspect-[4/5] rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-accent/30 flex items-end justify-center text-center p-4 hover-lift glow-gold"
                >
                  {hasImage && (
                    <>
                      <img
                        src={cat.image.url}
                        alt={cat.name}
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                      {/* Dark overlay so the title stays legible over any photo */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    </>
                  )}
                  {/* cursor-following warm gold light wash on hover */}
                  <span aria-hidden="true" className="spotlight pointer-events-none absolute inset-0 z-[1] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="relative z-10">
                    <div className={`font-serif text-xl ${hasImage ? 'text-white drop-shadow' : 'text-primary'}`}>{cat.name}</div>
                    <div className={`text-xs mt-1 ${hasImage ? 'text-white/80' : 'text-muted-foreground'}`}>{cat.productCount || 0} items</div>
                  </div>
                </Link>
                </Reveal>
              );
            })}
          </div>
        </section>
      )}

      <section className="container py-16 border-t">
        <Reveal animation="fade-up" className="flex flex-wrap items-end justify-between gap-3 mb-8">
          <div>
            <h2 className="font-serif text-3xl md:text-4xl">Featured Pieces</h2>
            <p className="text-muted-foreground mt-1">Hand-picked for the season</p>
          </div>
          <Link to="/products" className="text-sm font-medium text-primary inline-flex items-center gap-1 hover:gap-2 hover:text-primary-hover transition-all">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>

        {loadingFeatured ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : featured?.data?.length ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {featured.data.map((p, i) => (
              <Reveal key={p._id} delay={Math.min(i * 60, 400)}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-12">No featured products yet. Mark some products as Featured in the admin panel.</p>
        )}
      </section>
    </div>
  );
}
