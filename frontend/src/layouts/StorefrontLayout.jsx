import { Link, Outlet, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, User, LogOut, Search, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectIsAuthenticated, selectUser, clearUser } from '@/store/slices/authSlice';
import { useLogoutMutation } from '@/api/authApi';
import { useGetCartQuery } from '@/api/cartApi';
import { useGetWishlistQuery } from '@/api/wishlistApi';
import { BRAND_NAME } from '@/lib/constants';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/products', label: 'Shop' },
  { to: '/about', label: 'About' },
];

export default function StorefrontLayout() {
  const [open, setOpen] = useState(false);
  const isAuth = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [logout] = useLogoutMutation();

  const { data: cart } = useGetCartQuery(undefined, { skip: !isAuth });
  const { data: wl } = useGetWishlistQuery(undefined, { skip: !isAuth });
  const cartCount = cart?.data?.itemCount || 0;
  const wlCount = wl?.data?.itemCount || 0;

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } catch {/* ignore */}
    localStorage.removeItem('riwaya_token');
    dispatch(clearUser());
    toast.success('Logged out');
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="font-serif text-2xl font-semibold tracking-wide text-primary">
            {BRAND_NAME}
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} className="text-sm font-medium hover:text-primary transition-colors">
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link to="/products" className="p-2 rounded-md hover:bg-accent/30" aria-label="Search">
              <Search className="h-5 w-5" />
            </Link>
            <Link to="/wishlist" className="p-2 rounded-md hover:bg-accent/30 relative" aria-label="Wishlist">
              <Heart className="h-5 w-5" />
              {wlCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                  {wlCount}
                </span>
              )}
            </Link>
            <Link to="/cart" className="p-2 rounded-md hover:bg-accent/30 relative" aria-label="Cart">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            {isAuth ? (
              <div className="hidden md:flex items-center gap-2 ml-2">
                <Link to="/profile" className="p-2 rounded-md hover:bg-accent/30 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  <span className="text-sm font-medium hidden lg:inline">{user?.name?.split(' ')[0]}</span>
                </Link>
                <button onClick={handleLogout} className="p-2 rounded-md hover:bg-accent/30" aria-label="Logout">
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden md:inline text-sm font-medium px-3 py-2 rounded-md hover:bg-accent/30"
              >
                Sign in
              </Link>
            )}
            <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label="Menu">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <div className={cn('md:hidden border-t', open ? 'block' : 'hidden')}>
          <div className="container py-3 flex flex-col gap-2">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="py-2 text-sm font-medium"
              >
                {n.label}
              </Link>
            ))}
            {isAuth ? (
              <>
                <Link to="/profile" onClick={() => setOpen(false)} className="py-2 text-sm font-medium">
                  Profile
                </Link>
                <button onClick={handleLogout} className="py-2 text-sm font-medium text-left">
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setOpen(false)} className="py-2 text-sm font-medium">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container py-10 grid md:grid-cols-4 gap-8">
          <div>
            <div className="font-serif text-2xl text-primary">{BRAND_NAME}</div>
            <p className="text-sm text-muted-foreground mt-2">Premium Pakistani clothing — bridal, formal & embroidered.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">Shop</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/products" className="hover:text-primary">All Products</Link></li>
              <li><Link to="/products?featured=true" className="hover:text-primary">Featured</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">Account</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/profile" className="hover:text-primary">My Profile</Link></li>
              <li><Link to="/orders" className="hover:text-primary">My Orders</Link></li>
              <li><Link to="/track" className="hover:text-primary">Track Order</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-primary">About Us</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
