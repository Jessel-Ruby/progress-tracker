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

  // Edit mode — populated when navigated from TaskBoard with state.editTask
  const [editTaskId, setEditTaskId] = useState(null);

  // New Task Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
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

  // Document Attachment State
  const [attachmentFiles, setAttachmentFiles] = useState([]);

  // Pending user approvals state
  const [pendingUsers, setPendingUsers] = useState([]);
  const [pendingUsersLoading, setPendingUsersLoading] = useState(false);

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
          const res = await api.get('/departments');
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
  }, []);

  // Pre-fill form when navigated from TaskBoard with an editTask payload
  useEffect(() => {
    const et = location.state?.editTask;
    if (!et) return;
    setEditTaskId(et.id);
    setTitle(et.title || '');
    setDescription(et.description || '');
    setAssignedTo(et.assigned_to || '');
    setPriority(et.priority || 'medium');
    setDeadline(et.deadline ? et.deadline.substring(0, 16) : '');
    if (et.department_id) setSelectedDeptId(et.department_id);
    // Clear navigation state so a refresh doesn't re-trigger this
    navigate(location.pathname, { replace: true, state: {} });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

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

  // For Assign To dropdown: President/VP filter by their selected dept; HODs see only their own dept
  const departmentUsers = users.filter(u => {
    if (user?.is_president || user?.is_vice_president) {
      return selectedDeptId ? u.department_id === selectedDeptId : true;
    }
    return u.department_id === user?.department_id;
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
    setAssignedTo('');
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
        // Edit mode — PUT to update existing task
        await api.put(`/tasks/${editTaskId}`, {
          title,
          description,
          priority,
          assigned_to: assignedTo || null,
          deadline: deadline || null,
        });
        taskId = editTaskId;
        toast.success('Task updated successfully');
      } else {
        // Create mode — POST new task
        const taskRes = await api.post('/tasks', {
          title,
          description,
          priority,
          assigned_to: assignedTo || null,
          deadline: deadline || null,
          // President/VP pass their chosen department; HODs omit it (backend uses their dept)
          ...(user?.is_president || user?.is_vice_president ? { department_id: selectedDeptId || null } : {}),
        });
        taskId = taskRes.data.id;

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

        toast.success('Task assigned successfully');
      }

      resetForm();
    } catch (err) {
      toast.error(getErrorMessage(err, editTaskId ? 'Failed to update task' : 'Failed to create task'));
    } finally {
      setIsCreatingTask(false);
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel p-6">
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
                  onChange={e => { setSelectedDeptId(e.target.value); setAssignedTo(''); }}
                  disabled={departmentsLoading}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-neonBlue disabled:opacity-50"
                >
                  {departmentsLoading ? (
                    <option value="">Loading departments...</option>
                  ) : departments.length === 0 ? (
                    <option value="">No departments available</option>
                  ) : (
                    departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))
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
              <div>
                <label className="block text-sm text-gray-400 mb-1">Assign To</label>
                <select
                  value={assignedTo}
                  onChange={e => setAssignedTo(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-neonBlue"
                >
                  <option value="">{usersLoading ? 'Loading users...' : 'Select User...'}</option>
                  {departmentUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.username}</option>
                  ))}
                </select>
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
              className="w-full py-3 mt-4 rounded-lg bg-neonBlue text-black font-bold hover:bg-opacity-90 transition-opacity disabled:opacity-50"
            >
              {isCreatingTask
                ? (editTaskId ? 'Saving...' : 'Creating...')
                : (editTaskId ? 'Save Changes' : 'Create & Assign Task')}
            </button>
          </form>
        </div>

        <div className="glass-panel p-6">
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
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-neonBlue">{submission.task_title}</h4>
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

        {(user?.is_president || user?.is_vice_president) && (
          <div className="glass-panel p-6 lg:col-span-2">
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
      </div>
    </div>
  );
}
