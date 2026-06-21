import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';
import { getErrorMessage } from '../utils/apiError';
import { Mic, Square } from 'lucide-react';

export default function Admin() {
  const { user } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [usersLoading, setUsersLoading] = useState(true);

  // New Task Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState('medium');
  const [deadline, setDeadline] = useState('');


  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState('');
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

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
    fetchUsers();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSubmissions();
  }, []);

  const formatSubmittedAt = (iso) => {
    // eslint-disable-next-line react-hooks/purity
    const diffMs = Date.now() - new Date(iso).getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    if (hours < 1) return 'just now';
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  };

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

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setIsCreatingTask(true);
    try {
      const taskRes = await api.post('/tasks', {
        title,
        description,
        priority,
        assigned_to: assignedTo || null,
        deadline: deadline || null
      });

      if (audioBlob) {
        const formData = new FormData();
        // The backend expects a file upload
        formData.append('file', audioBlob, 'voicenote.webm');
        await api.post(`/tasks/${taskRes.data.id}/voice`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      // Reset form
      setTitle('');
      setDescription('');
      setAssignedTo('');
      setAudioBlob(null);
      setAudioURL('');
      setPriority('medium');
      setDeadline('');
      toast.success('Task assigned successfully');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to create task'));
    } finally {
      setIsCreatingTask(false);
    }
  };

  if (user?.role !== 'admin') {
    return <div className="p-8 text-red-500">Access Denied. Admins only.</div>;
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
          <h2 className="text-xl font-bold mb-6 text-white border-b border-white/10 pb-2">Assign New Task</h2>
          <form onSubmit={handleCreateTask} className="space-y-4">
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
                  {users.map(u => (
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

            <button
              type="submit"
              disabled={isCreatingTask}
              className="w-full py-3 mt-4 rounded-lg bg-neonBlue text-black font-bold hover:bg-opacity-90 transition-opacity disabled:opacity-50"
            >
              {isCreatingTask ? 'Creating...' : 'Create & Assign Task'}
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
      </div>
    </div>
  );
}
