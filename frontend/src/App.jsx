import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppRouter } from './routes/AppRouter.jsx';
import { useGetMeQuery } from './api/authApi.js';
import { setUser, clearUser } from './store/slices/authSlice.js';

export default function App() {
  const dispatch = useDispatch();
  // Rehydrate session on app boot if token cookie is present
  const { data, isError, isLoading } = useGetMeQuery();

  useEffect(() => {
    if (data?.data?.user) dispatch(setUser(data.data.user));
    else if (isError) dispatch(clearUser());
  }, [data, isError, dispatch]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading RIWAYA…</div>
      </div>
    );
  }

  return <AppRouter />;
}
