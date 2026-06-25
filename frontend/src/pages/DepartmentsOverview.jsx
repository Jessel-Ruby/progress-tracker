import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  ChevronRight, 
  TrendingUp, 
  CheckSquare 
} from 'lucide-react';

export default function DepartmentsOverview() {
  const { user } = useAuthStore();
  const [departments, setDepartments] = useState([]);
  const [deptProgress, setDeptProgress] = useState({});
  const [selectedDeptId, setSelectedDeptId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDepartmentsWithProgress = async () => {
      setLoading(true);
      try {
        const deptsRes = await api.get('/departments/');
        const depts = deptsRes.data;

        // Batch progress calls using Promise.all to avoid N+1 sequential request pattern
        const progressPromises = depts.map(dept =>
          api.get(`/departments/${dept.id}/progress`)
            .then(res => ({ deptId: dept.id, progress: res.data }))
            .catch(err => {
              console.error(`Failed to fetch progress for department ${dept.id}`, err);
              return { deptId: dept.id, progress: null };
            })
        );

        const progressResults = await Promise.all(progressPromises);
        
        const progressMap = {};
        progressResults.forEach(item => {
          progressMap[item.deptId] = item.progress;
        });

        setDepartments(depts);
        setDeptProgress(progressMap);

        // Pre-select first department if available
        if (depts.length > 0) {
          setSelectedDeptId(depts[0].id);
        }
      } catch (err) {
        toast.error(getErrorMessage(err, 'Failed to fetch departments and progress'));
      } finally {
        setLoading(false);
      }
    };

    fetchDepartmentsWithProgress();
  }, []);

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

  const selectedDept = departments.find(d => d.id === selectedDeptId);
  const selectedProgress = selectedDeptId ? deptProgress[selectedDeptId] : null;

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen text-white">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          <span className="text-[#9AD872]">Departments Overview</span>
        </h1>
        <p className="text-gray-400">
          Track task completion and team breakdown across all organization departments.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="w-12 h-12 border-4 border-neonBlue border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-400">Loading department statistics...</span>
        </div>
      ) : departments.length === 0 ? (
        <div className="glass-panel p-8 text-center text-gray-400">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <p className="text-lg font-semibold">No departments found</p>
          <p className="text-sm">Departments will appear here once they are created.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Department Cards Column */}
          <div className="lg:col-span-5 space-y-4">
            <h2 className="text-xl font-bold text-gray-300 mb-2">Departments</h2>
            <div className="space-y-4">
              {departments.map((dept) => {
                const progress = deptProgress[dept.id];
                const isSelected = dept.id === selectedDeptId;
                const percent = progress ? Math.round(progress.progress_percent) : 0;

                return (
                  <motion.div
                    key={dept.id}
                    onClick={() => setSelectedDeptId(dept.id)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`glass-panel p-5 cursor-pointer border transition-all duration-300 relative overflow-hidden ${
                      isSelected 
                        ? 'border-neonBlue shadow-lg shadow-neonBlue/10 bg-white/5' 
                        : 'border-white/10 hover:border-neonBlue/50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${
                          isSelected ? 'bg-neonBlue/20 text-neonBlue' : 'bg-white/5 text-gray-400'
                        }`}>
                          <Building2 size={20} />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-white leading-tight">{dept.name}</h3>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {progress?.per_member?.length ?? 0} members
                          </p>
                        </div>
                      </div>
                      <ChevronRight size={18} className={isSelected ? 'text-neonBlue' : 'text-gray-500'} />
                    </div>

                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Progress</span>
                        <span className="font-bold text-white">{percent}%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-neonBlue to-neonPurple h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-2 font-medium">
                        <span>{progress?.completed_tasks ?? 0} Completed</span>
                        <span>{progress?.total_tasks ?? 0} Total Tasks</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Department Detailed View Column */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {selectedDept && selectedProgress && (
                <motion.div
                  key={selectedDept.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* Detail Panel Title */}
                  <div>
                    <h2 className="text-xl font-bold text-gray-300 mb-2">Department Details</h2>
                    <div className="glass-panel p-6 border-white/10">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                          <h3 className="text-2xl font-extrabold text-white">{selectedDept.name}</h3>
                          {selectedDept.description && (
                            <p className="text-gray-400 text-sm mt-1">{selectedDept.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                          <div className="text-center px-2">
                            <span className="block text-2xl font-extrabold text-neonBlue">
                              {selectedProgress.total_tasks}
                            </span>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider">Tasks</span>
                          </div>
                          <div className="w-px h-8 bg-white/10"></div>
                          <div className="text-center px-2">
                            <span className="block text-2xl font-extrabold text-neonGreen">
                              {selectedProgress.completed_tasks}
                            </span>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider">Done</span>
                          </div>
                          <div className="w-px h-8 bg-white/10"></div>
                          <div className="text-center px-2">
                            <span className="block text-2xl font-extrabold text-neonPurple">
                              {Math.round(selectedProgress.progress_percent)}%
                            </span>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider">Progress</span>
                          </div>
                        </div>
                      </div>

                      {/* Detail Progress Bar */}
                      <div className="w-full bg-white/10 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-neonBlue to-neonPurple h-3 rounded-full transition-all duration-500" 
                          style={{ width: `${selectedProgress.progress_percent}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Members & Tasks Lists */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-gray-300">Team Progress</h3>
                    
                    {selectedProgress.per_member.length === 0 ? (
                      <div className="glass-panel p-6 text-center text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-2 text-gray-600" />
                        <p className="font-semibold">No active members in this department</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {selectedProgress.per_member.map((member) => {
                          const total = Object.values(member.task_counts_by_status).reduce((a, b) => a + b, 0);
                          const completed = member.task_counts_by_status.completed ?? 0;
                          const inProgress = member.task_counts_by_status.in_progress ?? 0;
                          const inReview = member.task_counts_by_status.in_review ?? 0;
                          const pending = member.task_counts_by_status.pending ?? 0;

                          return (
                            <div key={member.username} className="glass-panel p-5 border-white/5 space-y-4">
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
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
