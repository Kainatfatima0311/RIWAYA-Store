import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useDispatch } from 'react-redux';
import { useRegisterMutation } from '@/api/authApi';
import { setUser, selectIsAuthenticated } from '@/store/slices/authSlice';
import { useAppSelector } from '@/store/hooks';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Label, FormError } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';

const schema = z.object({
  name: z.string().min(2, 'Name is too short'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'At least 6 characters'),
  phone: z.string().min(7, 'Enter a valid phone').optional().or(z.literal('')),
});

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuth = useAppSelector(selectIsAuthenticated);
  const [register_, { isLoading }] = useRegisterMutation();
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  if (isAuth) return <Navigate to="/" replace />;

  const onSubmit = async (values) => {
    try {
      const res = await register_(values).unwrap();
      const user = res.data?.user;
      if (res.data?.token) localStorage.setItem('riwaya_token', res.data.token);
      dispatch(setUser(user));
      toast.success(`Welcome to RIWAYA, ${user.name.split(' ')[0]}!`);
      navigate('/');
    } catch (err) {
      toast.error(err?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-[70vh] container flex items-center justify-center py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>Join RIWAYA and discover premium fashion</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name" required>Full name</Label>
              <Input id="name" placeholder="Your name" {...register('name')} />
              <FormError>{errors.name?.message}</FormError>
            </div>
            <div>
              <Label htmlFor="email" required>Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
              <FormError>{errors.email?.message}</FormError>
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" placeholder="+92 300 1234567" {...register('phone')} />
              <FormError>{errors.phone?.message}</FormError>
            </div>
            <div>
              <Label htmlFor="password" required>Password</Label>
              <PasswordInput id="password" placeholder="At least 6 characters" {...register('password')} />
              <FormError>{errors.password?.message}</FormError>
            </div>
            <Button type="submit" loading={isLoading} className="w-full">Create account</Button>
            <p className="text-sm text-center text-muted-foreground">
              Already a member? <Link to="/login" className="text-primary font-medium">Sign in</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
