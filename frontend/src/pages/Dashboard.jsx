
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Zap, Clock, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import useDashboardData, {
  formatTaskDeadline,
  formatTaskStatus,
  getStatusStyle,
} from '../hooks/useDashboardData';

export default function Dashboard() {
  const [activityId, setActivityId] = useState('');

  const {
    user,
    pendingCount,
    dueThisWeekTasks,
    dueTodayCount,
    recentTasks,
    leaderboardTopPercent,
    xpProgress,
    loading,
    error,
    achievements,
    achievementsLoading,
    achievementsError,
    departments,
    departmentsLoading,
  } = useDashboardData(activityId);

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
              <p className="text-sm text-gray-400">Current Level</p>
              <h3 className="text-2xl font-bold text-white">Level {user?.level ?? 1}</h3>
            </div>
            <Target className="text-neonPurple" />
          </div>
          {leaderboardTopPercent !== null ? (
            <p className="text-xs text-neonPurple font-medium bg-neonPurple/10 px-2 py-1 rounded inline-block">
              Top {leaderboardTopPercent}%
            </p>
          ) : (
            <p className="text-xs text-gray-500">Keep going!</p>
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

      {/* Due This Week card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-panel p-6 mb-8 border-t-2 border-orange-400"
      >
        <div className="flex justify-between items-center mb-5 border-b border-white/10 pb-4">
          <h2 className="text-xl font-bold text-white">Due This Week</h2>
          <Link to="/tasks" className="text-sm text-orange-400 hover:underline">
            View All
          </Link>
        </div>

        {dueThisWeekTasks.length === 0 ? (
          <div className="flex flex-col items-center py-6 gap-2">
            <span className="text-4xl">🎉</span>
            <p className="text-green-400 font-semibold">All caught up!</p>
            <p className="text-xs text-gray-500">No tasks due this week.</p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Big pending count */}
            <div className="flex flex-col items-center justify-center min-w-[100px]">
              <span className="text-6xl font-extrabold text-orange-400 leading-none">
                {dueThisWeekTasks.length}
              </span>
              <span className="text-xs text-gray-400 mt-1 uppercase tracking-widest text-center">
                Due This Week
              </span>
            </div>

            {/* Urgent task list */}
            <div className="flex-1 w-full">
              <p className="text-xs text-orange-400 font-semibold uppercase tracking-wider mb-3">
                ⚡ Tasks due within 7 days
              </p>
              <ul className="space-y-2">
                {dueThisWeekTasks.slice(0, 3).map((task) => (
                  <li key={task.id}>
                    <Link
                      to={`/tasks/${task.id}`}
                      className="flex items-center justify-between p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 transition-colors group"
                    >
                      <span className="text-sm font-medium text-white group-hover:text-orange-300 transition-colors truncate mr-4">
                        {task.title}
                      </span>
                      <span className="text-xs text-orange-400 whitespace-nowrap">
                        {formatTaskDeadline(task.deadline)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              {dueThisWeekTasks.length > 3 && (
                <p className="text-xs text-gray-500 mt-2 text-right">
                  +{dueThisWeekTasks.length - 3} more task{dueThisWeekTasks.length - 3 !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-panel p-6">
          <div className="flex flex-wrap justify-between items-center mb-6 border-b border-white/10 pb-4 gap-3">
            <h2 className="text-xl font-bold text-white">Recent Tasks</h2>
            <div className="flex items-center gap-3">
              <select
                id="department-filter"
                value={activityId}
                onChange={(e) => setActivityId(e.target.value)}
                disabled={departmentsLoading}
                className="text-sm rounded-lg px-3 py-1.5 bg-white/10 border border-white/20 text-gray-200 focus:outline-none focus:border-neonBlue focus:ring-1 focus:ring-neonBlue transition-colors cursor-pointer disabled:opacity-50"
              >
                <option value="">All Departments</option>
                {departments.map((act) => (
                  <option key={act.id} value={act.id}>
                    {act.name}
                  </option>
                ))}
              </select>
              <Link to="/tasks" className="text-sm text-neonBlue hover:underline whitespace-nowrap">
                View All
              </Link>
            </div>
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
