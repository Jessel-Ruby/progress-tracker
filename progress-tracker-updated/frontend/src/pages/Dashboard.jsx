
import { motion } from 'framer-motion';
import { Target, Zap, Clock, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import useDashboardData, {
  formatTaskDeadline,
  formatTaskStatus,
  getStatusStyle,
} from '../hooks/useDashboardData';

export default function Dashboard() {
  const {
    user,
    pendingCount,
    dueTodayCount,
    recentTasks,
    leaderboardTopPercent,
    xpProgress,
    loading,
    error,
    achievements,
    achievementsLoading,
    achievementsError,
  } = useDashboardData();

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto min-h-[50vh] flex items-center justify-center">
        <p className="text-gray-400">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, <span className="neon-text">{user?.username}</span>!
        </h1>
        <p className="text-gray-400">Here's an overview of your progress today.</p>
      </motion.div>

      {error && (
        <div className="mb-6 p-3 rounded bg-red-500/20 border border-red-500/50 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="glass-panel p-6 border-t-2 border-neonBlue">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-gray-400">Total XP</p>
              <h3 className="text-2xl font-bold text-white">{user?.xp ?? 0}</h3>
            </div>
            <Zap className="text-neonBlue" />
          </div>
          <div className="w-full bg-white/10 rounded-full h-1.5">
            <div
              className="bg-neonBlue h-1.5 rounded-full transition-all"
              style={{ width: `${xpProgress.percent}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {xpProgress.isMaxLevel
              ? 'Max level reached'
              : `${xpProgress.xpToNext} XP to next level`}
          </p>
        </div>

        <div className="glass-panel p-6 border-t-2 border-neonPurple">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-gray-400">Current Rank</p>
              <h3 className="text-xl font-bold text-white">{user?.rank}</h3>
            </div>
            <Target className="text-neonPurple" />
          </div>
          {leaderboardTopPercent !== null ? (
            <p className="text-xs text-neonPurple font-medium bg-neonPurple/10 px-2 py-1 rounded inline-block">
              Top {leaderboardTopPercent}%
            </p>
          ) : (
            <p className="text-xs text-gray-500">Level {user?.level ?? 1}</p>
          )}
        </div>

        <div className="glass-panel p-6 border-t-2 border-neonGreen">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-gray-400">Day Streak</p>
              <h3 className="text-2xl font-bold text-white">{user?.streak ?? 0}</h3>
            </div>
            <Activity className="text-neonGreen" />
          </div>
          <p className="text-xs text-gray-500">You're on fire! Keep it up.</p>
        </div>

        <div className="glass-panel p-6 border-t-2 border-yellow-500">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-gray-400">Pending Tasks</p>
              <h3 className="text-2xl font-bold text-white">{pendingCount}</h3>
            </div>
            <Clock className="text-yellow-500" />
          </div>
          <p className="text-xs text-gray-500">
            {dueTodayCount === 0
              ? 'None due today'
              : `${dueTodayCount} due today`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-panel p-6">
          <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
            <h2 className="text-xl font-bold text-white">Recent Tasks</h2>
            <Link to="/tasks" className="text-sm text-neonBlue hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {recentTasks.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No tasks yet.</p>
            ) : (
              recentTasks.map((task) => (
                <Link
                  key={task.id}
                  to={`/tasks/${task.id}`}
                  className="block p-4 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between hover:bg-white/10 transition-colors"
                >
                  <div>
                    <h4 className="font-semibold text-white">{task.title}</h4>
                    <p className="text-sm text-gray-400">{formatTaskDeadline(task.deadline)}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(task.status)}`}
                  >
                    {formatTaskStatus(task.status)}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="glass-panel p-6">
          <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">
            Latest Achievements
          </h2>
          {achievementsLoading ? (
            <p className="text-sm text-gray-500 text-center py-8">Loading achievements...</p>
          ) : achievementsError ? (
            <p className="text-sm text-red-400 text-center py-8">{achievementsError}</p>
          ) : achievements.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No achievements yet.</p>
          ) : (
            <ul className="space-y-4">
              {achievements.slice(0, 3).map((ach) => (
                <li key={ach.id} className="flex items-center gap-4 bg-white/5 rounded-xl p-4 border border-white/10">
                  <span className="text-2xl">
                    {ach.badge_icon}
                  </span>
                  <div className="flex-1">
                    <div className="font-semibold text-white">{ach.title}</div>
                    <div className="text-xs text-gray-400">{ach.description}</div>
                    <div className="text-xs text-neonBlue mt-1">+{ach.xp_reward} XP</div>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {ach.earned_at ? new Date(ach.earned_at).toLocaleDateString() : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
