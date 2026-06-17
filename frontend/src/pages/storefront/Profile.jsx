import { useAppSelector } from '@/store/hooks';
import { selectUser } from '@/store/slices/authSlice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function Profile() {
  const user = useAppSelector(selectUser);
  return (
    <div className="container py-10 max-w-2xl">
      <h1 className="font-serif text-3xl mb-6">My Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle>{user?.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><span className="text-muted-foreground">Email:</span> {user?.email}</p>
          <p><span className="text-muted-foreground">Phone:</span> {user?.phone || '—'}</p>
          <p><span className="text-muted-foreground">Role:</span> <span className="capitalize">{user?.role}</span></p>
        </CardContent>
      </Card>
    </div>
  );
}
