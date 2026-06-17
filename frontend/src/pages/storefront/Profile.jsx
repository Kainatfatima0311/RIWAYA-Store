import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { User as UserIcon, Lock } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectUser, setUser } from '@/store/slices/authSlice';
import { useUpdateMeMutation, useChangePasswordMutation } from '@/api/authApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Reveal } from '@/components/ui/Reveal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { apiErrorMessage } from '@/lib/apiError';

export default function Profile() {
  const user = useAppSelector(selectUser);
  const dispatch = useAppDispatch();
  const [updateMe, { isLoading: saving }] = useUpdateMeMutation();
  const [changePassword, { isLoading: changing }] = useChangePasswordMutation();

  const info = useForm({ values: { name: user?.name || '', phone: user?.phone || '' } });
  const pw = useForm({ defaultValues: { currentPassword: '', newPassword: '', confirm: '' } });

  const onSaveInfo = async (v) => {
    try {
      const res = await updateMe({ name: v.name, phone: v.phone || undefined }).unwrap();
      if (res?.data) dispatch(setUser(res.data)); // keep the navbar name in sync immediately
      toast.success('Profile updated');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not update profile'));
    }
  };

  const onChangePassword = async (v) => {
    if (v.newPassword !== v.confirm) {
      pw.setError('confirm', { message: 'Passwords do not match' });
      return;
    }
    try {
      await changePassword({ currentPassword: v.currentPassword, newPassword: v.newPassword }).unwrap();
      toast.success('Password changed');
      pw.reset();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not change password'));
    }
  };

  return (
    <div className="container py-10 max-w-2xl space-y-6">
      <div className="flex items-center gap-4 animate-fade-up">
        <div
          aria-hidden="true"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-serif text-lg uppercase animate-pop"
        >
          {(user?.name || user?.email || '?').trim().charAt(0)}
        </div>
        <h1 className="font-serif text-3xl">My Profile</h1>
      </div>

      {/* Account information */}
      <Reveal animation="fade-up" delay={80}>
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserIcon className="h-5 w-5 text-primary" /> Account information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={info.handleSubmit(onSaveInfo)} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label required>Name</Label>
                  <Input {...info.register('name', { required: 'Name is required' })} />
                  {info.formState.errors.name && <p className="text-xs text-destructive mt-1">{info.formState.errors.name.message}</p>}
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input {...info.register('phone')} placeholder="+92 300 1234567" />
                </div>
              </div>
              <div>
                <Label>Email</Label>
                <Input value={user?.email || ''} disabled readOnly />
                <p className="text-xs text-muted-foreground mt-1">Email can’t be changed here — contact support if you need to update it.</p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Role: <span className="capitalize font-medium text-foreground">{user?.role?.replace('_', ' ')}</span></span>
                <Button type="submit" loading={saving}>Save changes</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </Reveal>

      {/* Change password */}
      <Reveal animation="fade-up" delay={160}>
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5 text-primary" /> Change password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={pw.handleSubmit(onChangePassword)} className="space-y-4">
              <div>
                <Label required>Current password</Label>
                <Input type="password" autoComplete="current-password" {...pw.register('currentPassword', { required: 'Required' })} />
                {pw.formState.errors.currentPassword && <p className="text-xs text-destructive mt-1">{pw.formState.errors.currentPassword.message}</p>}
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label required>New password</Label>
                  <Input type="password" autoComplete="new-password" {...pw.register('newPassword', { required: 'Required', minLength: { value: 6, message: 'At least 6 characters' } })} />
                  {pw.formState.errors.newPassword && <p className="text-xs text-destructive mt-1">{pw.formState.errors.newPassword.message}</p>}
                </div>
                <div>
                  <Label required>Confirm new password</Label>
                  <Input type="password" autoComplete="new-password" {...pw.register('confirm', { required: 'Required' })} />
                  {pw.formState.errors.confirm && <p className="text-xs text-destructive mt-1">{pw.formState.errors.confirm.message}</p>}
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" loading={changing}>Update password</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </Reveal>
    </div>
  );
}
