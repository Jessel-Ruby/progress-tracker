import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, YAxis } from 'recharts';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';
import { Zap, Target, Star, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../utils/apiError';

export default function Analytics() {
  const { user } = useAuthStore();
  const [taskCompletionData, setTaskCompletionData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await api.get('/analytics/tasks-completed-by-day?days=7');
        setTaskCompletionData(res.data);
      } catch (err) {
        toast.error(getErrorMessage(err, 'Failed to fetch task completion data'));
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [user]);

  if (!user) return null;

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">Analytics Overview</h1>
        <p className="text-gray-400">Track your productivity, XP, and contribution streaks.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="glass-panel p-6 flex items-center gap-4 border-neonGreen">
          <div className="p-3 bg-neonBlue/10 rounded-xl text-neonBlue">
            <Zap size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-400">Total XP</p>
            <p className="text-2xl font-bold text-white">{user.xp}</p>
          </div>
        </div>
        <div className="glass-panel p-6 flex items-center gap-4 border-neonGreen">
          <div className="p-3 bg-neonPurple/10 rounded-xl text-neonPurple ">
            <Star size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-400">Level</p>
            <p className="text-2xl font-bold text-white">{user.level}</p>
          </div>
        </div>
        <div className="glass-panel p-6 flex items-center gap-4 border-neonGreen">
          <div className="p-3 bg-neonGreen/10 rounded-xl text-neonGreen">
            <Target size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-400">Day Streak</p>
            <p className="text-2xl font-bold text-white">{user.streak}</p>
          </div>
        </div>
        <div className="glass-panel p-6 flex items-center gap-4">
          <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-500">
            <Target size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-400">Day Streak</p>
            <p className="text-2xl font-bold text-white">{user.streak}</p>
          </div>
        </div>
      </div>

      <div className="glass-panel p-6 border-neonGreen">
        <h3 className="text-xl font-bold mb-6 text-white">Tasks Completed (7 Days)</h3>
        <div className="h-64 flex items-center justify-center">
          {loading ? (
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <Loader2 className="animate-spin" size={32} />
              <p>Loading chart data...</p>
            </div>
          ) : taskCompletionData.length === 0 ? (
            <div className="text-gray-500">No data available for the last 7 days.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskCompletionData}>
                <XAxis dataKey="name" stroke="#666" />
                <YAxis allowDecimals={false} stroke="#666" />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <Bar dataKey="completed" fill="#2fff00ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

