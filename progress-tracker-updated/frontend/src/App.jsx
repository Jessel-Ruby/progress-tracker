import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import TaskDetail from './pages/TaskDetail';
import Analytics from './pages/Analytics';
import Leaderboard from './pages/Leaderboard';
import Admin from './pages/Admin';
import AdminRoute from './components/AdminRoute';
import useAuthStore from './store/useAuthStore';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  return (
    <div className="flex bg-dark min-h-screen text-white">
      <Sidebar />
      <main className="flex-1 md:ml-64 bg-dark min-h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

// Redirect logged-in users away from /login
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
};

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
        <Route path="/tasks/:id" element={<ProtectedRoute><TaskDetail /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
        <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
