import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';
import { Trophy, Medal } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

import toast from 'react-hot-toast';
import { getErrorMessage } from '../utils/apiError';

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user: currentUser } = useAuthStore();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await api.get('/analytics/leaderboard');
        setLeaders(res.data);
      } catch (err) {
        toast.error(getErrorMessage(err, 'Failed to fetch leaderboard'));
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const getRankIcon = (index) => {
    switch (index) {
      case 0: return <Trophy className="text-yellow-400 w-6 h-6" />;
      case 1: return <Medal className="text-gray-300 w-6 h-6" />;
      case 2: return <Medal className="text-amber-600 w-6 h-6" />;
      default: return <span className="text-gray-500 font-bold w-6 h-6 flex items-center justify-center">{index + 1}</span>;
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {loading && (
        <div className="mb-4 text-center text-gray-400">Loading leaderboard...</div>
      )}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <h1 className="text-4xl font-bold mb-4">
          <span className="neon-text">Global Leaderboard</span>
        </h1>
        <p className="text-gray-400">Compete with your peers and rise through the ranks.</p>
      </motion.div>

      <div className="glass-panel overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="p-4 text-gray-400 font-semibold w-16 text-center">Rank</th>
              <th className="p-4 text-gray-400 font-semibold">User</th>
              <th className="p-4 text-gray-400 font-semibold text-center">Level</th>
              <th className="p-4 text-gray-400 font-semibold text-center">Rank Title</th>
              <th className="p-4 text-gray-400 font-semibold text-right">XP</th>
            </tr>
          </thead>
          <tbody>
            {leaders.map((user, index) => {
              const isCurrentUser = currentUser?.username === user.username;
              return (
                <motion.tr
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  key={user.username}
                  className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                    isCurrentUser ? 'bg-neonBlue/10' : ''
                  }`}
                >
                  <td className="p-4 flex justify-center items-center h-full">
                    {getRankIcon(index)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                        isCurrentUser ? 'bg-neonBlue text-black' : 'bg-gray-800 text-white'
                      }`}>
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <span className={`font-bold ${isCurrentUser ? 'text-neonBlue' : 'text-white'}`}>
                        {user.username} {isCurrentUser && '(You)'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-center font-medium text-gray-300">
                    {user.level}
                  </td>
                  <td className="p-4 text-center">
                    <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-gray-300 border border-white/10">
                      {user.rank}
                    </span>
                  </td>
                  <td className="p-4 text-right font-mono text-neonBlue font-bold">
                    {user.xp.toLocaleString()} XP
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
