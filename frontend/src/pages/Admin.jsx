import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';
import { getErrorMessage } from '../utils/apiError';
import { formatSubmittedAt } from '../utils/dateFormatters';
import { Mic, Square, Paperclip } from 'lucide-react';

export default function Admin() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [usersLoading, setUsersLoading] = useState(true);
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Edit mode — populated when navigated from TaskBoard with state.editTask
  const [editTaskId, setEditTaskId] = useState(null);

  // New Task Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [priority, setPriority] = useState('medium');
  const [deadline, setDeadline] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState(''); // President/VP dept selector

  // Departments (for President/VP dept picker)
  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);


  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState('');
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const dropdownRef = useRef(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Document Attachment State
  const [attachmentFiles, setAttachmentFiles] = useState([]);

  // Pending user approvals state
  const [pendingUsers, setPendingUsers] = useState([]);
  const [pendingUsersLoading, setPendingUsersLoading] = useState(false);

  // Tasks assigned by me state
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [assignedTasksLoading, setAssignedTasksLoading] = useState(false);

  const fetchSubmissions = async () => {
    setSubmissionsLoading(true);
    try {
      const res = await api.get('/tasks/submissions/pending');
      setSubmissions(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load submissions'));
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const fetchPendingUsers = async () => {
    if (user?.is_president || user?.is_vice_president) {
      setPendingUsersLoading(true);
      try {
        const res = await api.get('/auth/pending');
        setPendingUsers(res.data);
      } catch (err) {
        toast.error(getErrorMessage(err, 'Failed to load pending users'));
      } finally {
        setPendingUsersLoading(false);
      }
    }
  };

  const fetchAssignedTasks = async () => {
    if (user?.role === 'hod' || user?.is_president || user?.is_vice_president) {
      setAssignedTasksLoading(true);
      try {
        const res = await api.get('/tasks', { params: { assigned_by_me: true } });
        setAssignedTasks(res.data);
      } catch (err) {
        toast.error(getErrorMessage(err, 'Failed to load assigned tasks'));
      } finally {
        setAssignedTasksLoading(false);
      }
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      setUsersLoading(true);
      try {
        const res = await api.get('/auth/users');
        setUsers(res.data);
      } catch (err) {
        toast.error(getErrorMessage(err, 'Failed to load users'));
      } finally {
        setUsersLoading(false);
      }
    };
    const fetchDepartments = async () => {
      if (user?.is_president || user?.is_vice_president) {
        setDepartmentsLoading(true);
        try {
          const res = await api.get('/departments/');
          setDepartments(res.data);
          if (res.data.length > 0) setSelectedDeptId(res.data[0].id);
        } catch (err) {
          toast.error(getErrorMessage(err, 'Failed to load departments'));
        } finally {
          setDepartmentsLoading(false);
        }
      }
    };
    fetchUsers();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSubmissions();
    fetchPendingUsers();
    fetchDepartments();
    fetchAssignedTasks();
  }, []);

  // Pre-fill form when navigated from TaskBoard with an editTask payload
  useEffect(() => {
    const et = location.state?.editTask;
    if (!et) return;
    setEditTaskId(et.id);
    setTitle(et.title || '');
    setDescription(et.description || '');
    setSelectedUserIds(et.assigned_to ? [et.assigned_to] : []);
    setPriority(et.priority || 'medium');
    setDeadline(et.deadline ? et.deadline.substring(0, 16) : '');
    if (et.department_id) setSelectedDeptId(et.department_id);
    // Clear navigation state so a refresh doesn't re-trigger this
    navigate(location.pathname, { replace: true, state: {} });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleApproveUser = async (userId) => {
    try {
      await api.post(`/auth/approve/${userId}`);
      setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
      toast.success('User registration approved');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to approve user'));
    }
  };

  const handleRejectUser = async (userId) => {
    if (!window.confirm('Are you sure you want to reject this user signup application?')) return;
    try {
      await api.post(`/auth/reject/${userId}`);
      setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
      toast.success('User registration rejected');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to reject user'));
    }
  };

  const handleRemoveUser = async (userToRemove) => {
    if (!window.confirm(`Remove ${userToRemove.username}? Their assigned tasks will be unassigned. This cannot be undone.`)) {
      return;
    }
    
    try {
      await api.delete(`/auth/${userToRemove.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== userToRemove.id));
      toast.success('User removed successfully');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to remove user'));
    }
  };

  // For Assign To dropdown: Filter by selected dept if set, otherwise show all users
  const departmentUsers = users.filter(u => {
    return selectedDeptId ? u.department_id === selectedDeptId : true;
  });

  const handleApprove = async (submissionId) => {
    setReviewingId(submissionId);
    try {
      await api.post(`/tasks/submissions/${submissionId}/approve`);
      setSubmissions((prev) => prev.filter((s) => s.id !== submissionId));
      toast.success('Submission approved');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to approve submission'));
    } finally {
      setReviewingId(null);
    }
  };

  const handleReject = async (submissionId) => {
    const feedback = window.prompt('Optional feedback for the submitter:');
    if (feedback === null) return;

    setReviewingId(submissionId);
    try {
      await api.post(`/tasks/submissions/${submissionId}/reject`, {
        feedback: feedback || null,
      });
      setSubmissions((prev) => prev.filter((s) => s.id !== submissionId));
      toast.success('Submission rejected');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to reject submission'));
    } finally {
      setReviewingId(null);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioURL(URL.createObjectURL(blob));
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      toast.error('Microphone access was denied or unavailable');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const resetForm = () => {
    setEditTaskId(null);
    setTitle('');
    setDescription('');
    setSelectedUserIds([]);
    setAudioBlob(null);
    setAudioURL('');
    setPriority('medium');
    setDeadline('');
    setAttachmentFiles([]);
    if (departments.length > 0) setSelectedDeptId(departments[0].id);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setIsCreatingTask(true);
    try {
      let taskId;

      if (editTaskId) {
        const taskBeingEdited = assignedTasks.find(t => t.id === editTaskId);
        if (taskBeingEdited && taskBeingEdited.assigned_by !== user?.id) {
          toast.error("Not authorized to update this task");
          setIsCreatingTask(false);
          return;
        }
        // Edit mode — PUT to update existing task
        await api.put(`/tasks/${editTaskId}`, {
          title,
          description,
          priority,
          assigned_to: selectedUserIds[0] || null,
          deadline: deadline || null,
        });
        taskId = editTaskId;
        toast.success('Task updated successfully');
      } else {
        // Create mode — POST new task
        const targetIds = selectedUserIds.length > 0 ? selectedUserIds : [null];
        for (const userId of targetIds) {
          const taskRes = await api.post('/tasks/', {
            title,
            description,
            priority,
            assigned_to: userId,
            deadline: deadline || null,
            // President/VP pass their chosen department; HODs omit it (backend uses their dept)
            ...(user?.is_president || user?.is_vice_president ? { department_id: selectedDeptId || null } : {}),
          });
          const taskId = taskRes.data.id;

          if (audioBlob) {
            const formData = new FormData();
            formData.append('file', audioBlob, 'voicenote.webm');
            await api.post(`/tasks/${taskId}/voice`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
          }

          for (const file of attachmentFiles) {
            const formData = new FormData();
            formData.append('file', file);
            await api.post(`/tasks/${taskId}/attachments`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
          }
        }

        toast.success(`${targetIds.length} task${targetIds.length === 1 ? '' : 's'} created`);
      }

      resetForm();
      fetchAssignedTasks();
    } catch (err) {
      toast.error(getErrorMessage(err, editTaskId ? 'Failed to update task' : 'Failed to create task'));
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleEditClick = (task) => {
    if (task.assigned_by !== user?.id) {
      toast.error("Not authorized to update this task");
      return;
    }
    setEditTaskId(task.id);
    setTitle(task.title || '');
    setDescription(task.description || '');
    setSelectedUserIds(task.assigned_to ? [task.assigned_to] : []);
    setPriority(task.priority || 'medium');
    setDeadline(task.deadline ? task.deadline.substring(0, 16) : '');
    if (task.department_id) setSelectedDeptId(task.department_id);
  };

  const handleDeleteTask = async (task) => {
    if (task.assigned_by !== user?.id) {
      toast.error("Not authorized to update this task");
      return;
    }
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) {
      return;
    }
    try {
      await api.delete(`/tasks/${task.id}`);
      setAssignedTasks((prev) => prev.filter((t) => t.id !== task.id));
      toast.success('Task deleted successfully');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete task'));
    }
  };

  const isAdminOrHOD = user && (user.role === 'hod' || user.is_president || user.is_vice_president);
  if (!isAdminOrHOD) {
    return <div className="p-8 text-red-500">Access Denied. Elevated roles only.</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-400">Manage users and assign tasks.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 ">
        <div className="glass-panel p-6 border-neonGreen">
          <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-2">
            <h2 className="text-xl font-bold text-white">
              {editTaskId ? 'Edit Task' : 'Assign New Task'}
            </h2>
            {editTaskId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-gray-400 hover:text-white transition-colors px-3 py-1 rounded border border-white/10 hover:border-white/30"
              >
                Cancel Edit
              </button>
            )}
          </div>
          <form onSubmit={handleCreateTask} className="space-y-4">
            {/* Department picker — President/VP only */}
            {(user?.is_president || user?.is_vice_president) && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">Department</label>
                <select
                  value={selectedDeptId}
                  onChange={e => { setSelectedDeptId(e.target.value); setSelectedUserIds([]); }}
                  disabled={departmentsLoading}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-neonBlue disabled:opacity-50"
                >
                  {departmentsLoading ? (
                    <option value="">Loading departments...</option>
                  ) : departments.length === 0 ? (
                    <option value="">No departments available</option>
                  ) : (
                    <>
                      <option value="">All</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </>
                  )}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-neonBlue"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Description</label>
              <textarea
                required
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-neonBlue"
                rows="3"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative" ref={dropdownRef}>
                <label className="block text-sm text-gray-400 mb-1">Assign To</label>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-left text-white focus:outline-none focus:border-neonBlue flex justify-between items-center text-sm"
                >
                  <span>
                    {selectedUserIds.length === 0
                      ? 'Select Users'
                      : `${selectedUserIds.length} user${selectedUserIds.length === 1 ? '' : 's'} selected`}
                  </span>
                  <span className="text-gray-400">▼</span>
                </button>
                {isDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-[#121212] border border-white/10 rounded-lg p-3 space-y-2 z-50 shadow-2xl">
                    {usersLoading ? (
                      <div className="text-gray-500 text-sm">Loading users...</div>
                    ) : departmentUsers.length === 0 ? (
                      <div className="text-gray-500 text-sm">Select Users</div>
                    ) : (
                      departmentUsers.map(u => {
                        const isChecked = selectedUserIds.includes(u.id);
                        return (
                          <label key={u.id} className="flex items-center gap-3 text-sm text-gray-300 hover:text-white transition-colors cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedUserIds(selectedUserIds.filter(id => id !== u.id));
                                } else {
                                  setSelectedUserIds([...selectedUserIds, u.id]);
                                }
                              }}
                              className="rounded border-white/20 bg-black/40 text-neonBlue focus:ring-neonBlue focus:ring-opacity-25 focus:ring-1 focus:ring-offset-0 focus:outline-none cursor-pointer"
                            />
                            <span>{u.username}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-neonBlue"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Deadline (optional)</label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-neonBlue"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Voice Instructions (Optional)</label>
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-lg border border-white/10">
                {!isRecording ? (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="p-3 bg-red-500/20 text-red-500 rounded-full hover:bg-red-500/40 transition-colors"
                  >
                    <Mic size={20} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="p-3 bg-gray-500/20 text-gray-300 rounded-full hover:bg-gray-500/40 transition-colors flex items-center gap-2"
                  >
                    <Square size={20} /> Stop
                  </button>
                )}
                {isRecording && <span className="text-red-500 animate-pulse text-sm font-semibold">Recording...</span>}
                {audioURL && !isRecording && (
                  <audio src={audioURL} controls className="h-10 flex-1" />
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Attachments (Optional)</label>
              <label
                htmlFor="task-attachments"
                className="flex items-center gap-3 bg-white/5 p-4 rounded-lg border border-white/10 border-dashed cursor-pointer hover:bg-white/10 transition-colors"
              >
                <Paperclip size={18} className="text-gray-400 shrink-0" />
                <span className="text-sm text-gray-400 truncate">
                  {attachmentFiles.length > 0
                    ? `${attachmentFiles.length} file${attachmentFiles.length > 1 ? 's' : ''} selected`
                    : 'Click to attach PDF, DOC, or image files'}
                </span>
                <input
                  id="task-attachments"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,image/*"
                  className="sr-only"
                  onChange={e => setAttachmentFiles(Array.from(e.target.files))}
                />
              </label>
              {attachmentFiles.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {attachmentFiles.map((f, i) => (
                    <li key={i} className="text-xs text-gray-500 truncate pl-1">• {f.name}</li>
                  ))}
                </ul>
              )}
            </div>

            <button
              type="submit"
              disabled={isCreatingTask}
              className="w-full py-3 mt-4 rounded-lg bg-[#558467] text-black font-bold hover:bg-opacity-90 transition-opacity disabled:opacity-50"
            >
              {isCreatingTask
                ? (editTaskId ? 'Saving...' : 'Creating...')
                : (editTaskId ? 'Save Changes' : 'Create & Assign Task')}
            </button>
          </form>
        </div>

        <div className="space-y-8">
          <div className="glass-panel p-6 border-neonGreen">
            <h2 className="text-xl font-bold mb-6 text-white border-b border-white/10 pb-2">Recent Submissions</h2>
            <div className="space-y-4">
              {submissionsLoading ? (
                <p className="text-sm text-gray-500 text-center py-8">Loading submissions...</p>
              ) : submissions.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No pending submissions.</p>
              ) : (
                submissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="p-4 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="flex justify-between items-start mb-2 ">
                      <h4 className="font-semibold text-white">{submission.task_title}</h4>
                      <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded">
                        Pending Review
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">
                      Submitted by <strong>{submission.submitter_username}</strong>{' '}
                      {formatSubmittedAt(submission.submitted_at)}
                    </p>
                    {submission.comment && (
                      <p className="text-sm text-gray-500 mt-2">{submission.comment}</p>
                    )}
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/submissions/${submission.id}`)}
                        className="px-3 py-1 bg-neonBlue/20 text-neonBlue rounded text-sm hover:bg-neonBlue/40 transition-colors"
                      >
                        Review
                      </button>
                      <button
                        type="button"
                        disabled={reviewingId === submission.id}
                        onClick={() => handleApprove(submission.id)}
                        className="px-3 py-1 bg-green-500/20 text-green-400 rounded text-sm hover:bg-green-500/40 transition-colors disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={reviewingId === submission.id}
                        onClick={() => handleReject(submission.id)}
                        className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-sm hover:bg-red-500/40 transition-colors disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="glass-panel p-6 border-neonGreen">
            <h2 className="text-xl font-bold mb-6 text-white border-b border-white/10 pb-2">
              Tasks I Assigned (Last 7 Days)
            </h2>
            <div className="space-y-4">
              {assignedTasksLoading ? (
                <p className="text-sm text-gray-500 text-center py-8">Loading tasks...</p>
              ) : assignedTasks.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No tasks assigned in the last 7 days.</p>
              ) : (
                assignedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 bg-white/5 rounded-lg border border-white/10 flex justify-between items-center"
                  >
                    <div>
                      <h4 className="font-semibold text-white">{task.title}</h4>
                      <p className="text-sm text-gray-400 mt-1">
                        Assigned to: <strong className="text-gray-300">{task.assigned_to_username || 'Unassigned'}</strong>
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-xs px-2 py-1 rounded capitalize font-medium ${
                        task.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        task.status === 'in_review' ? 'bg-yellow-500/20 text-yellow-400' :
                        task.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {task.status.replace('_', ' ')}
                      </span>
                      {task.assigned_by === user?.id && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditClick(task)}
                            className="px-2 py-0.5 bg-neonBlue/20 text-neonBlue rounded text-xs hover:bg-neonBlue/40 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTask(task)}
                            className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/40 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {(user?.is_president || user?.is_vice_president) && (
          <div className="glass-panel p-6 lg:col-span-2 border-neonGreen">
            <h2 className="text-xl font-bold mb-6 text-white border-b border-white/10 pb-2">Pending Member Approvals</h2>
            <div className="space-y-4">
              {pendingUsersLoading ? (
                <p className="text-sm text-gray-500 text-center py-8">Loading pending applications...</p>
              ) : pendingUsers.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No pending registrations.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-gray-400 text-sm">
                        <th className="pb-3 font-semibold">Username</th>
                        <th className="pb-3 font-semibold">Email</th>
                        <th className="pb-3 font-semibold">Requested Role</th>
                        <th className="pb-3 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {pendingUsers.map((pendingUser) => (
                        <tr key={pendingUser.id} className="text-sm text-gray-300">
                          <td className="py-3 font-semibold text-neonBlue">{pendingUser.username}</td>
                          <td className="py-3">{pendingUser.email}</td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded text-xs bg-white/5 border border-white/10 text-gray-300 capitalize">
                              {pendingUser.role === 'hod' ? (pendingUser.is_president ? 'President' : (pendingUser.is_vice_president ? 'VP' : 'HOD')) : 'Member'}
                            </span>
                          </td>
                          <td className="py-3 flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleApproveUser(pendingUser.id)}
                              className="px-3 py-1 bg-green-500/20 text-green-400 rounded text-sm hover:bg-green-500/40 transition-colors font-semibold"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectUser(pendingUser.id)}
                              className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-sm hover:bg-red-500/40 transition-colors font-semibold"
                            >
                              Reject
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {(user?.is_president || user?.is_vice_president) && (
          <div className="glass-panel p-6 lg:col-span-2 border-neonGreen">
            <h2 className="text-xl font-bold mb-6 text-white border-b border-white/10 pb-2">Active Members Management</h2>
            <div className="space-y-4">
              {usersLoading ? (
                <p className="text-sm text-gray-500 text-center py-8">Loading active users...</p>
              ) : users.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No active users.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-gray-400 text-sm">
                        <th className="pb-3 font-semibold">Username</th>
                        <th className="pb-3 font-semibold">Email</th>
                        <th className="pb-3 font-semibold">Role</th>
                        <th className="pb-3 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {users.map((activeUser) => (
                        <tr key={activeUser.id} className="text-sm text-gray-300">
                          <td className="py-3 font-semibold text-neonBlue">{activeUser.username}</td>
                          <td className="py-3">{activeUser.email}</td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded text-xs bg-white/5 border border-white/10 text-gray-300 capitalize">
                              {activeUser.role === 'hod' ? (activeUser.is_president ? 'President' : (activeUser.is_vice_president ? 'VP' : 'HOD')) : 'Member'}
                            </span>
                          </td>
                          <td className="py-3 flex gap-2">
                            {user.id !== activeUser.id && (
                              <button
                                type="button"
                                onClick={() => handleRemoveUser(activeUser)}
                                className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-sm hover:bg-red-500/40 transition-colors font-semibold"
                              >
                                Remove
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
