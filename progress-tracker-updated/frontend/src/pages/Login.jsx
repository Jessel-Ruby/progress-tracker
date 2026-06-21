import { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import api from '../services/api';
import { getErrorMessage } from '../utils/apiError';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { label: '', color: 'bg-transparent', score: 0 };
    if (pwd.length < 8) return { label: 'Too Short (Min 8)', color: 'bg-red-500/80', score: 1 };
    if (pwd.length > 12) return { label: 'Too Long (Max 12)', color: 'bg-red-500/80', score: 1 };

    let score = 0;
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { label: 'Weak', color: 'bg-red-500', score: 1 };
    if (score === 2) return { label: 'Medium', color: 'bg-yellow-500', score: 2 };
    return { label: 'Strong', color: 'bg-green-500', score: 3 };
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setEmail('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      const result = await login(username, password);
      if (!result.success) {
        setError(result.message);
        toast.error(result.message);
      } else {
        navigate('/dashboard');
      }
    } else {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) {
        const msg = 'Invalid email format. Email must end with a valid domain suffix (e.g. .com, .org, .in)';
        setError(msg);
        toast.error(msg);
        return;
      }
      if (password.length < 8 || password.length > 12) {
        const msg = 'Password must be between 8 and 12 characters long';
        setError(msg);
        toast.error(msg);
        return;
      }
      if (password !== confirmPassword) {
        const msg = 'Passwords do not match';
        setError(msg);
        toast.error(msg);
        return;
      }
      try {
        await api.post('/auth/signup', { username, email, password });
        toast.success('Account created! Signing you in...');
        const result = await login(username, password);
        if (!result.success) {
          const message = 'Account created, but sign-in failed. Please try logging in.';
          setError(message);
          toast.error(message);
        } else {
          navigate('/dashboard');
        }
      } catch (err) {
        const message = getErrorMessage(err, 'Signup failed');
        setError(message);
        toast.error(message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neonBlue/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neonPurple/10 rounded-full blur-[100px] pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel p-8 max-w-md w-full relative z-10"
      >
        <div className="text-center mb-8">
          <Activity className="w-12 h-12 mx-auto mb-4 text-neonBlue" />
          <h1 className="text-2xl font-bold text-white mb-2">
            {isLogin ? 'Welcome Back' : 'Join Progress Tracker'}
          </h1>
          <p className="text-gray-400 text-sm">
            {isLogin ? 'Sign in to track your productivity.' : 'Create an account to start tracking.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded bg-red-500/20 border border-red-500/50 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-neonBlue transition-colors"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-neonBlue transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-neonBlue transition-colors"
            />
            {!isLogin && password && (
              <div className="mt-2">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-gray-400">Password Strength:</span>
                  <span className={`font-semibold ${
                    getPasswordStrength(password).label === 'Weak' || getPasswordStrength(password).label.startsWith('Too')
                      ? 'text-red-400'
                      : getPasswordStrength(password).label === 'Medium'
                      ? 'text-yellow-400'
                      : 'text-green-400'
                  }`}>
                    {getPasswordStrength(password).label}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-300 ${getPasswordStrength(password).color}`} style={{
                    width: getPasswordStrength(password).score === 1 ? '33.3%' : getPasswordStrength(password).score === 2 ? '66.6%' : '100%'
                  }}></div>
                </div>
              </div>
            )}
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">Confirm Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-neonBlue transition-colors"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-neonBlue to-neonPurple text-white font-bold hover:opacity-90 transition-opacity"
          >
            {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={toggleMode}
            className="text-neonBlue hover:underline"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}