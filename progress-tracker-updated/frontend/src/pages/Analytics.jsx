import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Heatmap from '../components/Heatmap';
import useAuthStore from '../store/useAuthStore';
import api from '../services/api';
import { Zap, Trophy, Target, Star } from 'lucide-react';

import toast from 'react-hot-toast';
import { getErrorMessage } from '../utils/apiError';

export default function Analytics() {
  const { user } = useAuthStore();
  const [heatmapData, setHeatmapData] = useState([]);
  
  // Dummy data for charts (would be replaced with real backend data)
  const taskCompletionData = [
    { name: 'Mon', completed: 4 },
    { name: 'Tue', completed: 3 },
    { name: 'Wed', completed: 7 },
    { name: 'Thu', completed: 2 },
    { name: 'Fri', completed: 6 },
    { name: 'Sat', completed: 1 },
    { name: 'Sun', completed: 5 },
  ];

  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const fetchHeatmap = async () => {
      setLoading(true);
      try {
        const res = await api.get('/analytics/heatmap');
        setHeatmapData(res.data);
      } catch (err) {
        toast.error(getErrorMessage(err, 'Failed to fetch heatmap data'));
      } finally {
        setLoading(false);
      }
    };
    fetchHeatmap();
  }, []);

  if (!user) return null;

  return (
    <div className="p-8">
      {loading && (
        <div className="mb-4 text-center text-gray-400">Loading analytics...</div>
      )}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">Analytics Overview</h1>
        <p className="text-gray-400">Track your productivity, XP, and contribution streaks.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="glass-panel p-6 flex items-center gap-4">
          <div className="p-3 bg-neonBlue/10 rounded-xl text-neonBlue">
            <Zap size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-400">Total XP</p>
            <p className="text-2xl font-bold text-white">{user.xp}</p>
          </div>
        </div>
        <div className="glass-panel p-6 flex items-center gap-4">
          <div className="p-3 bg-neonPurple/10 rounded-xl text-neonPurple">
            <Star size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-400">Level</p>
            <p className="text-2xl font-bold text-white">{user.level}</p>
          </div>
        </div>
        <div className="glass-panel p-6 flex items-center gap-4">
          <div className="p-3 bg-neonGreen/10 rounded-xl text-neonGreen">
            <Trophy size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-400">Current Rank</p>
            <p className="text-xl font-bold text-white truncate">{user.rank}</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="glass-panel p-6 lg:col-span-2">
          <h3 className="text-xl font-bold mb-6 text-white">Contribution Heatmap</h3>
          <Heatmap data={heatmapData} />
        </div>
        
        <div className="glass-panel p-6">
          <h3 className="text-xl font-bold mb-6 text-white">Tasks Completed (7 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskCompletionData}>
                <XAxis dataKey="name" stroke="#666" />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <Bar dataKey="completed" fill="#00f3ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
