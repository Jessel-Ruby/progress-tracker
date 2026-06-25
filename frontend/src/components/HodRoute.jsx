import { Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import useAuthStore from '../store/useAuthStore';

export default function HodRoute({ children }) {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading || (isAuthenticated && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isAuthorized = user && user.status === 'active' && user.role === 'hod';
  if (!isAuthorized) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex bg-dark min-h-screen text-white">
      <Sidebar />
      <main className="flex-1 md:ml-64 bg-dark min-h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
