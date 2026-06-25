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
import SubmissionReview from './pages/SubmissionReview';
import Profile from './pages/Profile';
import AdminRoute from './components/AdminRoute';
import ExecutiveRoute from './components/ExecutiveRoute';
import DepartmentsOverview from './pages/DepartmentsOverview';
import HodRoute from './components/HodRoute';
import DepartmentProgress from './pages/DepartmentProgress';
import useAuthStore from './store/useAuthStore';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  
  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user && user.status === 'pending') return <Navigate to="/pending" replace />;
  
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

// Protected wrapper specifically for the pending page
const ProtectedRouteForPending = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user && user.status === 'active') return <Navigate to="/dashboard" replace />;
  return children;
};

// Pending Screen Component
const PendingScreen = () => {
  const { logout } = useAuthStore();
  return (
    <div className="min-h-screen bg-dark flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neonBlue/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neonPurple/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="glass-panel p-8 max-w-md w-full relative z-10 space-y-6">
        <div className="relative">
          <div className="w-20 h-20 mx-auto rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center animate-pulse">
            <span className="text-4xl text-yellow-500 font-bold">⏳</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white">Awaiting Approval</h1>
        <p className="text-gray-400 text-sm leading-relaxed">
          Your registration has been received successfully! A club administrator or President/VP will review and activate your account shortly.
        </p>

        <div className="text-xs text-gray-500 border-t border-white/5 pt-4">
          Once approved, you will automatically gain access to your dashboard.
        </div>

        <button
          onClick={logout}
          className="w-full py-2.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all text-sm font-semibold"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
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
        
        <Route path="/pending" element={
          <ProtectedRouteForPending>
            <PendingScreen />
          </ProtectedRouteForPending>
        } />
        
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
        <Route path="/tasks/:id" element={<ProtectedRoute><TaskDetail /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
        <Route path="/admin/submissions/:id" element={<AdminRoute><SubmissionReview /></AdminRoute>} />
        <Route path="/departments-overview" element={<ExecutiveRoute><DepartmentsOverview /></ExecutiveRoute>} />
        <Route path="/department-progress" element={<HodRoute><DepartmentProgress /></HodRoute>} />
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
