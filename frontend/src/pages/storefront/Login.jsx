import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useDispatch } from 'react-redux';
import { flushSync } from 'react-dom';
import { useLoginMutation } from '@/api/authApi';
import { setUser, selectIsAuthenticated, selectIsStaff } from '@/store/slices/authSlice';
import { useAppSelector } from '@/store/hooks';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Label, FormError } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { isStaff as isStaffRole } from '@/lib/constants';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuth = useAppSelector(selectIsAuthenticated);
  const isStaff = useAppSelector(selectIsStaff);
  const [login, { isLoading }] = useLoginMutation();
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  // If already logged in, send to the right place based on role
  // (NOT a blanket '/' which would trap admins on the storefront)
  if (isAuth) return <Navigate to={isStaff ? '/admin' : '/'} replace />;

  const onSubmit = async (values) => {
    try {
      const res = await login(values).unwrap();
      const user = res.data?.user;
      if (!user?.role) {
        toast.error('Login response is missing role information');
        console.error('[Login] Missing role in response:', res);
        return;
      }
      if (res.data?.token) localStorage.setItem('riwaya_token', res.data.token);

      // flushSync forces the dispatch to commit BEFORE navigate runs.
      // Without this, StaffRoute can read a stale Redux state and bounce admins back to /.
      flushSync(() => {
        dispatch(setUser(user));
      });

      const staff = isStaffRole(user.role);
      console.log(`[Login] Authenticated as ${user.email} (role: ${user.role}) — redirecting to ${staff ? '/admin' : '/'}`);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}`);
      const dest = staff ? '/admin' : location.state?.from?.pathname || '/';
      navigate(dest, { replace: true });
    } catch (err) {
      console.error('[Login] Error:', err);
      toast.error(err?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-[70vh] container flex items-center justify-center py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in to your RIWAYA account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email" required>Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
              <FormError>{errors.email?.message}</FormError>
            </div>
            <div>
              <Label htmlFor="password" required>Password</Label>
              <PasswordInput id="password" placeholder="••••••••" {...register('password')} />
              <FormError>{errors.password?.message}</FormError>
            </div>
            <Button type="submit" loading={isLoading} className="w-full">Sign in</Button>
            <p className="text-sm text-center text-muted-foreground">
              No account? <Link to="/register" className="text-primary font-medium">Create one</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
