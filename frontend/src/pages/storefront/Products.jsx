import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useStorefrontProductsQuery, useStorefrontCategoriesQuery } from '@/api/productApi';
import { ProductCard, ProductCardSkeleton } from '@/components/storefront/ProductCard';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sort: searchParams.get('sort') || '-publishedAt',
    isFeatured: searchParams.get('isFeatured') || '',
  });
  const [page, setPage] = useState(Number(searchParams.get('page') || 1));
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const sp = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) sp.set(k, v); });
    if (page > 1) sp.set('page', String(page));
    setSearchParams(sp, { replace: true });
  }, [filters, page, setSearchParams]);

  const { data: catData } = useStorefrontCategoriesQuery();
  // Strip empty filter values so the backend Zod schema doesn't try to validate '' as an ObjectId/number.
  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined && v !== null)
  );
  const { data, isLoading, isFetching } = useStorefrontProductsQuery({ ...cleanFilters, page, limit: 12 });

  const update = (k, v) => { setFilters((f) => ({ ...f, [k]: v })); setPage(1); };
  const clearFilters = () => {
    setFilters({ search: '', category: '', minPrice: '', maxPrice: '', sort: '-publishedAt', isFeatured: '' });
    setPage(1);
  };

  const products = data?.data || [];
  const pagination = data?.pagination;

  const flattenCategories = (cats, depth = 0, acc = []) => {
    for (const c of cats || []) {
      acc.push({ ...c, depth });
      if (c.children?.length) flattenCategories(c.children, depth + 1, acc);
    }
    return acc;
  };
  const flatCats = flattenCategories(catData?.data);

  return (
    <div className="container py-8">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl">Shop</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {pagination ? `${pagination.total} product${pagination.total !== 1 ? 's' : ''}` : 'Browse our collection'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="lg:hidden">
          <SlidersHorizontal className="h-4 w-4 mr-2" /> Filters
        </Button>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-8">
        <aside className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
          <div className="sticky top-20 space-y-5">
            <div>
              <label className="text-sm font-medium block mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search products" value={filters.search} onChange={(e) => update('search', e.target.value)} className="pl-9" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Category</label>
              <Select value={filters.category} onChange={(e) => update('category', e.target.value)}>
                <option value="">All categories</option>
                {flatCats.map((c) => (
                  <option key={c._id} value={c._id}>{'— '.repeat(c.depth)}{c.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Price range (Rs)</label>
              <div className="grid grid-cols-2 gap-2">
                <Input type="number" placeholder="Min" value={filters.minPrice} onChange={(e) => update('minPrice', e.target.value)} />
                <Input type="number" placeholder="Max" value={filters.maxPrice} onChange={(e) => update('maxPrice', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Sort</label>
              <Select value={filters.sort} onChange={(e) => update('sort', e.target.value)}>
                <option value="-publishedAt">Newest first</option>
                <option value="publishedAt">Oldest first</option>
                <option value="basePrice">Price: low → high</option>
                <option value="-basePrice">Price: high → low</option>
                <option value="-totalSold">Best selling</option>
                <option value="-averageRating">Top rated</option>
              </Select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={filters.isFeatured === 'true'} onChange={(e) => update('isFeatured', e.target.checked ? 'true' : '')} />
              <span className="text-sm">Featured only</span>
            </label>
            <Button variant="outline" size="sm" className="w-full" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" /> Clear filters
            </Button>
          </div>
        </aside>

        <div>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 9 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <EmptyState title="No products found" description="Try adjusting your filters or browse all categories." />
          ) : (
            <>
              <div className={`grid grid-cols-2 md:grid-cols-3 gap-4 ${isFetching ? 'opacity-50' : ''}`}>
                {products.map((p) => <ProductCard key={p._id} product={p} />)}
              </div>
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                  <span className="text-sm text-muted-foreground px-4">Page {page} of {pagination.totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
