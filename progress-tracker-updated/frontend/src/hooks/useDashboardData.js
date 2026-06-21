import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';
import { getErrorMessage } from '../utils/apiError';

const XP_THRESHOLDS = { 1: 0, 2: 100, 3: 250, 4: 500, 5: 1000, 6: 2000, 7: 4000 };

const PENDING_STATUSES = ['pending', 'in_progress', 'in_review'];

export function getXpProgress(xp = 0, level = 1) {
  const currentThreshold = XP_THRESHOLDS[level] ?? 0;
  const nextThreshold = XP_THRESHOLDS[level + 1];

  if (nextThreshold === undefined) {
    return { percent: 100, xpToNext: 0, isMaxLevel: true };
  }

  const span = nextThreshold - currentThreshold;
  const progress = Math.max(0, xp - currentThreshold);

  return {
    percent: Math.min(100, (progress / span) * 100),
    xpToNext: Math.max(0, nextThreshold - xp),
    isMaxLevel: false,
  };
}

export function formatTaskDeadline(deadline) {
  if (!deadline) return 'No deadline';
  const date = new Date(deadline);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return 'Due today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Due tomorrow';
  return `Due ${date.toLocaleDateString()}`;
}

export function formatTaskStatus(status) {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const STATUS_STYLES = {
  pending: 'bg-gray-500/20 text-gray-300',
  in_progress: 'bg-yellow-500/20 text-yellow-500',
  in_review: 'bg-neonBlue/20 text-neonBlue',
  completed: 'bg-green-500/20 text-green-400',
};

export function getStatusStyle(status) {
  return STATUS_STYLES[status] || STATUS_STYLES.pending;
}

export default function useDashboardData() {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState([]);
  const [leaderboardTopPercent, setLeaderboardTopPercent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [achievementsLoading, setAchievementsLoading] = useState(true);
  const [achievementsError, setAchievementsError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [tasksRes, leaderboardRes] = await Promise.all([
          api.get('/tasks'),
          api.get('/analytics/leaderboard', { params: { limit: 50 } }),
        ]);

        if (cancelled) return;

        setTasks(tasksRes.data);

        const username = useAuthStore.getState().user?.username;
        const leaders = leaderboardRes.data;
        const index = leaders.findIndex((entry) => entry.username === username);

        if (index >= 0 && leaders.length > 0) {
          setLeaderboardTopPercent(Math.round((1 - index / leaders.length) * 100));
        } else {
          setLeaderboardTopPercent(null);
        }
      } catch (err) {
        if (!cancelled) {
          const message = getErrorMessage(err, 'Failed to load dashboard data. Please try again.');
          setError(message);
          toast.error(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    async function loadAchievements() {
      setAchievementsLoading(true);
      setAchievementsError(null);
      try {
        const res = await api.get('/analytics/achievements');
        if (!cancelled) setAchievements(res.data);
      } catch (err) {
        if (!cancelled) {
          const msg = getErrorMessage(err, 'Failed to load achievements');
          setAchievementsError(msg);
        }
      } finally {
        if (!cancelled) setAchievementsLoading(false);
      }
    }

    load();
    loadAchievements();
    return () => {
      cancelled = true;
    };
  }, []);

  const pendingTasks = tasks.filter((task) => PENDING_STATUSES.includes(task.status));

  const dueTodayCount = tasks.filter((task) => {
    if (!task.deadline || !PENDING_STATUSES.includes(task.status)) return false;
    return new Date(task.deadline).toDateString() === new Date().toDateString();
  }).length;

  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 3);

  return {
    user,
    pendingCount: pendingTasks.length,
    dueTodayCount,
    recentTasks,
    leaderboardTopPercent,
    xpProgress: getXpProgress(user?.xp ?? 0, user?.level ?? 1),
    loading,
    error,
    achievements,
    achievementsLoading,
    achievementsError,
  };
}
