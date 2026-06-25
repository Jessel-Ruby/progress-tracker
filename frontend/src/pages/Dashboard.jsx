
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
    recentSubmissions,
    leaderboardTopPercent,
    xpProgress,
    loading,
    error,
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
          Welcome back, <span className="text-[#9AD872]">{user?.username}</span>!
        </h1>
        <p className="text-gray-400">Here's an overview of your progress today.</p>
      </motion.div>

      {error && (
        <div className="mb-6 p-3 rounded bg-red-500/20 border border-red-500/50 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="glass-panel p-6 border-t-2 border-neonGreen">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-gray-400">Total XP</p>
              <h3 className="text-2xl font-bold text-white">{user?.xp ?? 0}</h3>
            </div>
            <Zap className="text-neonGreen" />
          </div>
          <div className="w-full bg-white/10 rounded-full h-1.5">
            <div
              className="bg-neonGreen h-1.5 rounded-full transition-all"
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

        <div className="glass-panel p-6 border-t-2 border-neonGreen">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-gray-400">Pending Tasks</p>
              <h3 className="text-2xl font-bold text-white">{pendingCount}</h3>
            </div>
            <Clock className="text-neonGreen" />
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
        className="glass-panel p-6 mb-8 border-t-2 border-neonGreen"
      >
        <div className="flex justify-between items-center mb-5 border-b border-white/10 pb-4">
          <h2 className="text-xl font-bold text-white">Due This Week</h2>
          <Link to="/tasks" className="text-sm text-white hover:underline">
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
              <p className="text-xs text-green-400 font-semibold uppercase tracking-wider mb-3">
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
        <div className="lg:col-span-2 glass-panel p-6 border-neonGreen">
          <div className="flex flex-wrap justify-between items-center mb-6 border-b border-white/10 pb-4 gap-3">
            <h2 className="text-xl font-bold text-white">Recent Tasks</h2>
            <Link to="/tasks" className="text-sm text-white hover:underline whitespace-nowrap">
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

        <div className="lg:col-span-1 glass-panel p-6 border-neonGreen">
          <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
            <h2 className="text-xl font-bold text-white-400">Recent Submissions</h2>
          </div>
          <div className="space-y-4">
            {(() => {
              const fiveDaysAgo = new Date();
              fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
              const recent = recentSubmissions.filter(
                (sub) => sub.submitted_at && new Date(sub.submitted_at) >= fiveDaysAgo
              );
              const SUBMISSION_BADGE = {
                pending: 'bg-yellow-500/20 text-yellow-400',
                approved: 'bg-green-500/20 text-green-400',
                rejected: 'bg-red-500/20 text-red-400',
                revision_requested: 'bg-orange-500/20 text-orange-400',
              };
              if (recent.length === 0) {
                return (
                  <p className="text-sm text-gray-500 text-center py-8">
                    No submissions in the last 5 days.
                  </p>
                );
              }
              return recent.map((sub) => (
                <div
                  key={sub.id}
                  className="p-4 bg-white/5 rounded-xl border border-white/10 gap-2 flex flex-col"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm font-semibold text-white truncate">
                      {sub.task_title}
                    </span>
                    <span
                      className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium capitalize ${
                        SUBMISSION_BADGE[sub.status] ?? 'bg-gray-500/20 text-gray-300'
                      }`}
                    >
                      {sub.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(sub.submitted_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
