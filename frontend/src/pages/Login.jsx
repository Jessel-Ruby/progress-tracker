import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import api from '../services/api';
import { getErrorMessage } from '../utils/apiError';
import {
  SPECIAL_CHAR_REGEX,
  EMAIL_REGEX,
  getPasswordRules,
  getStrengthFromRules,
} from '../utils/passwordValidation';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [departments, setDepartments] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [requestedRole, setRequestedRole] = useState('member');
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLogin) {
      const fetchDepts = async () => {
        try {
          const res = await api.get('/departments/public');
          setDepartments(res.data);
          if (res.data.length > 0) {
            setSelectedDeptId(res.data[0].id);
          }
        } catch (err) {
          console.error('Failed to fetch departments:', err);
        }
      };
      fetchDepts();
    }
  }, [isLogin]);

  // Reset all fields and switch mode
  const toggleMode = () => {
    setIsLogin((prev) => !prev);
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setEmail('');
    setError('');
    setSelectedDeptId('');
    setRequestedRole('member');
  };

  const passwordRules = !isLogin ? getPasswordRules(password) : null;
  const strength = passwordRules ? getStrengthFromRules(passwordRules) : null;

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
      // --- Client-side validation ---
      if (!EMAIL_REGEX.test(email)) {
        const message = 'Please enter a valid email address.';
        setError(message);
        toast.error(message);
        return;
      }
      if (password.length < 8) {
        const message = 'Password must be at least 8 characters long.';
        setError(message);
        toast.error(message);
        return;
      }
      if (password.length > 12) {
        const message = 'Password cannot exceed 12 characters.';
        setError(message);
        toast.error(message);
        return;
      }
      if (!/[A-Z]/.test(password)) {
        const message = 'Password must contain at least one uppercase letter.';
        setError(message);
        toast.error(message);
        return;
      }
      if (!/[a-z]/.test(password)) {
        const message = 'Password must contain at least one lowercase letter.';
        setError(message);
        toast.error(message);
        return;
      }
      if (!/[0-9]/.test(password)) {
        const message = 'Password must contain at least one number.';
        setError(message);
        toast.error(message);
        return;
      }
      if (!SPECIAL_CHAR_REGEX.test(password)) {
        const message = 'Password must contain at least one special character.';
        setError(message);
        toast.error(message);
        return;
      }
      if (/\s/.test(password)) {
        const message = 'Password must not contain any spaces.';
        setError(message);
        toast.error(message);
        return;
      }
      if (password.toLowerCase() === username.toLowerCase()) {
        const message = 'Password must not be identical to the username.';
        setError(message);
        toast.error(message);
        return;
      }
      if (password !== confirmPassword) {
        const message = 'Passwords do not match.';
        setError(message);
        toast.error(message);
        return;
      }

      try {
        await api.post('/auth/signup', {
          username,
          email,
          password,
          department_id: selectedDeptId || null,
          requested_role: requestedRole,
        });
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
            {isLogin ? 'Welcome Back' : 'Join ProTrack'}
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
            <>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email</label>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-neonBlue transition-colors"
                  placeholder="you@example.com"
                />
                {email.length > 0 && !EMAIL_REGEX.test(email) && (
                  <p className="mt-1 text-xs text-red-400">Please enter a valid email address (e.g. name@gmail.com).</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Department</label>
                <select
                  value={selectedDeptId}
                  onChange={e => setSelectedDeptId(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-neonBlue transition-colors"
                >
                  {departments.length === 0 ? (
                    <option value="" disabled className="bg-dark text-white">Loading departments...</option>
                  ) : (
                    departments.map(d => (
                      <option key={d.id} value={d.id} className="bg-dark text-white">
                        {d.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Requested Role</label>
                <select
                  value={requestedRole}
                  onChange={e => setRequestedRole(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-neonBlue transition-colors"
                >
                  <option value="member" className="bg-dark text-white">Member</option>
                  <option value="hod" className="bg-dark text-white">Department HOD</option>
                  <option value="president" className="bg-dark text-white">President</option>
                  <option value="vp" className="bg-dark text-white">Vice President</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input
              type="password"
              required
              maxLength={12}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-neonBlue transition-colors"
            />

            {/* Password validation checklist — signup only */}
            {!isLogin && password.length > 0 && passwordRules && strength && (
              <div className="mt-3">
                {/* Strength bar */}
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3].map((step) => (
                    <div
                      key={step}
                      className="h-1.5 flex-1 rounded-full transition-all duration-300"
                      style={{
                        backgroundColor:
                          strength.score >= step ? strength.color : 'rgba(255,255,255,0.1)',
                      }}
                    />
                  ))}
                </div>
                <p className="text-xs mb-2" style={{ color: strength.color }}>
                  {strength.label}
                </p>

                {/* Rule checklist */}
                <ul className="space-y-1">
                  {passwordRules.map((rule) => (
                    <li
                      key={rule.key}
                      className="flex items-center gap-2 text-xs transition-all duration-200"
                      style={{ color: rule.met ? '#22c55e' : '#f87171' }}
                    >
                      <span
                        className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold flex-shrink-0"
                        style={{
                          backgroundColor: rule.met ? 'rgba(34,197,94,0.15)' : 'rgba(248,113,113,0.15)',
                          color: rule.met ? '#22c55e' : '#f87171',
                        }}
                      >
                        {rule.met ? '✓' : '×'}
                      </span>
                      <span style={{ textDecoration: rule.met ? 'line-through' : 'none', opacity: rule.met ? 0.6 : 1 }}>
                        {rule.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Confirm Password — signup only */}
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
              {confirmPassword.length > 0 && password !== confirmPassword && (
                <p className="mt-1 text-xs text-red-400">Passwords do not match.</p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-lg bg-[#9AD872] text-[#0a0f0a] font-bold hover:opacity-90 transition-opacity"
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