import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../utils/apiError';
import { 
  Building2, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  ClipboardList, 
  TrendingUp, 
  CheckSquare 
} from 'lucide-react';

export default function DepartmentProgress() {
  const { user } = useAuthStore();
  const [department, setDepartment] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDepartmentAndProgress = async () => {
      if (!user?.department_id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch HOD's department details and progress in parallel
        const [deptRes, progressRes] = await Promise.all([
          api.get('/departments/'),
          api.get(`/departments/${user.department_id}/progress`)
        ]);

        // /departments/ returns a list of visible departments. 
        // For HOD, it will return a list containing only their own department.
        const userDept = deptRes.data.find(d => d.id === user.department_id);
        
        setDepartment(userDept);
        setProgress(progressRes.data);
      } catch (err) {
        toast.error(getErrorMessage(err, 'Failed to fetch department progress'));
      } finally {
        setLoading(false);
      }
    };

    fetchDepartmentAndProgress();
  }, [user]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/20">
            <CheckCircle size={12} /> Completed
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/20">
            <TrendingUp size={12} /> In Progress
          </span>
        );
      case 'in_review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-500/20">
            <ClipboardList size={12} /> In Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-500/20 text-gray-400 border border-gray-500/20">
            <Clock size={12} /> Pending
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto min-h-screen text-white flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-neonBlue border-t-transparent rounded-full animate-spin"></div>
        <span className="text-gray-400">Loading department details...</span>
      </div>
    );
  }

  if (!user?.department_id || !department || !progress) {
    return (
      <div className="p-8 max-w-5xl mx-auto min-h-screen text-white">
        <div className="glass-panel p-8 text-center text-gray-400">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <p className="text-lg font-semibold">No department assigned</p>
          <p className="text-sm">You are not currently assigned to lead any department.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen text-white space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">
          <span className="text-[#9AD872]">My Department Progress</span>
        </h1>
        <p className="text-gray-400">
          Monitor your department's members, task statistics, and overall completion rate.
        </p>
      </div>

      {/* Overview Stats Block */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 border-neonGreen"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-2xl font-extrabold text-white">{department.name}</h3>
            {department.description && (
              <p className="text-gray-400 text-sm mt-1">{department.description}</p>
            )}
          </div>
          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
            <div className="text-center px-2">
              <span className="block text-2xl font-extrabold text-neonBlue">
                {progress.total_tasks}
              </span>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider">Tasks</span>
            </div>
            <div className="w-px h-8 bg-white/10"></div>
            <div className="text-center px-2">
              <span className="block text-2xl font-extrabold text-neonGreen">
                {progress.completed_tasks}
              </span>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider">Done</span>
            </div>
            <div className="w-px h-8 bg-white/10"></div>
            <div className="text-center px-2">
              <span className="block text-2xl font-extrabold text-neonPurple">
                {Math.round(progress.progress_percent)}%
              </span>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider">Progress</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white/10 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-neonBlue to-neonPurple h-3 rounded-full transition-all duration-500" 
            style={{ width: `${progress.progress_percent}%` }}
          ></div>
        </div>
      </motion.div>

      {/* Members & Tasks Lists */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-gray-300">Team Progress</h3>
        
        {progress.per_member.length === 0 ? (
          <div className="glass-panel p-6 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-2 text-gray-600" />
            <p className="font-semibold">No active members in your department</p>
          </div>
        ) : (
          <div className="space-y-4">
            {progress.per_member.map((member) => {
              const total = Object.values(member.task_counts_by_status).reduce((a, b) => a + b, 0);
              const completed = member.task_counts_by_status.completed ?? 0;
              const inProgress = member.task_counts_by_status.in_progress ?? 0;
              const inReview = member.task_counts_by_status.in_review ?? 0;
              const pending = member.task_counts_by_status.pending ?? 0;

              return (
                <motion.div 
                  key={member.username} 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-panel p-5 border-white/5 space-y-4"
                >
                  {/* Member Summary Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-neonBlue/10 border border-neonBlue/20 text-neonBlue flex items-center justify-center font-bold text-lg">
                        {member.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{member.username}</h4>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                          <CheckSquare size={12} className="text-neonGreen" />
                          <span>
                            {completed} / {total} tasks completed
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Counter Pillbox */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {pending > 0 && (
                        <span className="px-2 py-0.5 rounded bg-gray-500/10 text-gray-400 border border-gray-500/10">
                          {pending} pending
                        </span>
                      )}
                      {inProgress > 0 && (
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/10">
                          {inProgress} active
                        </span>
                      )}
                      {inReview > 0 && (
                        <span className="px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/10">
                          {inReview} review
                        </span>
                      )}
                      {completed > 0 && (
                        <span className="px-2 py-0.5 rounded bg-green-500/10 text-neonGreen border border-green-500/10">
                          {completed} done
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Task List for Member */}
                  {member.tasks.length === 0 ? (
                    <p className="text-sm text-gray-500 italic px-2">No tasks assigned.</p>
                  ) : (
                    <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                      {member.tasks.map((task, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                          <span className="text-sm font-semibold text-gray-200 truncate pr-4">
                            {task.title}
                          </span>
                          <div className="shrink-0">
                            {getStatusBadge(task.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
