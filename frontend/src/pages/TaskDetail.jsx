import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { UploadCloud, CheckCircle, FileAudio, Paperclip, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { getErrorMessage } from '../utils/apiError';

export default function TaskDetail() {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [latestSubmission, setLatestSubmission] = useState(null);
  const [files, setFiles] = useState([]);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingTask, setIsLoadingTask] = useState(true);

  useEffect(() => {
    const fetchTask = async () => {
      setIsLoadingTask(true);
      try {
        const res = await api.get(`/tasks/${id}`);
        setTask(res.data);
        // Fetch submissions to check for reviewer feedback
        try {
          const subRes = await api.get(`/tasks/${id}/submissions`);
          if (Array.isArray(subRes.data) && subRes.data.length > 0) {
            const sorted = [...subRes.data].sort(
              (a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)
            );
            setLatestSubmission(sorted[0]);
          }
        } catch {
          // Submissions endpoint optional — silently ignore errors
        }
      } catch (err) {
        toast.error(getErrorMessage(err, 'Failed to load task'));
      } finally {
        setIsLoadingTask(false);
      }
    };
    fetchTask();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData();
    if (files && files.length > 0) {
      files.forEach((file) => {
        formData.append('files', file);
      });
    }
    if (comment) formData.append('comment', comment);

    try {
      await api.post(`/tasks/${id}/submit`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      // Refresh task
      const res = await api.get(`/tasks/${id}`);
      setTask(res.data);
      setFiles([]);
      setComment('');
      toast.success('Task submitted for review');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to submit task'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingTask) return <div className="p-8 text-white">Loading task...</div>;
  if (!task) return <div className="p-8 text-red-400">Task not found or could not be loaded.</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8"
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{task.title}</h1>
            <div className="flex flex-wrap items-center gap-3">
              <span className={`px-3 py-1 text-sm rounded-full ${
                task.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                task.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                'bg-yellow-500/20 text-yellow-400'
              }`}>
                {task.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            {(task.assigned_to_username || task.assigned_by_username) && (
              <div className="mt-3 text-sm text-gray-400 space-y-1">
                {task.assigned_to_username && (
                  <div>
                    Assigned to: <span className="text-white font-medium">{task.assigned_to_username}</span>
                  </div>
                )}
                {task.assigned_by_username && (
                  <div>
                    Assigned by: <span className="text-white font-medium">{task.assigned_by_username}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <span className="text-gray-400 text-sm">
            Due: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}
          </span>
        </div>

        <div className="prose prose-invert max-w-none mb-8">
          <p className="text-gray-300">{task.description}</p>
        </div>

        {task.voice_note_path && (
          <div className="mb-8 p-4 bg-white/5 rounded-xl flex items-center gap-4">
            <FileAudio className="text-neonPurple w-8 h-8" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold mb-2">Voice Instructions</h4>
              <audio
                src={
                  task.voice_note_path.startsWith('http://') || task.voice_note_path.startsWith('https://')
                    ? task.voice_note_path
                    : `${import.meta.env.VITE_API_URL}/${task.voice_note_path}`
                }
                controls
                className="w-full h-10"
              >
                Your browser does not support the audio element.
              </audio>
            </div>
          </div>
        )}

        {task.attachments && task.attachments.length > 0 && (
          <div className="mb-8 p-4 bg-white/5 rounded-xl">
            <h4 className="text-sm font-semibold mb-3 text-white flex items-center gap-2">
              <Paperclip className="text-neonBlue w-5 h-5" />
              <span>Task Attachments</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {task.attachments.map((url, index) => {
                const filename = decodeURIComponent(url.substring(url.lastIndexOf('/') + 1));
                return (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 bg-black/20 hover:bg-white/10 border border-white/5 rounded-lg text-sm text-neonBlue hover:text-white transition-all truncate"
                  >
                    <span className="truncate flex-1 pr-4">{filename}</span>
                    <span className="text-xs text-gray-500 hover:text-neonBlue underline shrink-0">Open File</span>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        <hr className="border-white/10 my-8" />

        <h3 className="text-xl font-bold mb-4">Submit Work</h3>

        {latestSubmission &&
          (latestSubmission.status === 'revision_requested' || latestSubmission.status === 'rejected') &&
          latestSubmission.feedback && (
            <div className="mb-6 bg-amber-500/10 border border-amber-500/30 text-amber-300 p-4 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-amber-400" />
              <div>
                <p className="font-semibold text-amber-400 mb-1">
                  {latestSubmission.status === 'revision_requested' ? 'Revision Requested' : 'Rejected'}
                </p>
                <p className="text-sm leading-relaxed">{latestSubmission.feedback}</p>
              </div>
            </div>
          )}

        {task.status === 'completed' || task.status === 'in_review' ? (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl flex items-center gap-3">
            <CheckCircle />
            <span>This task has been submitted and is {task.status.replace('_', ' ')}.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Submission Comment</label>
              <textarea
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-neonBlue transition-colors"
                rows="4"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Describe your work..."
              ></textarea>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Attach File</label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-white/10 border-dashed rounded-xl cursor-pointer hover:bg-white/5 transition-colors relative overflow-hidden">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadCloud className="w-8 h-8 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-400">
                      <span className="font-semibold text-neonBlue">Click to upload</span> or drag and drop
                    </p>
                    {files.length > 0 && (
                      <p className="text-sm text-neonGreen font-semibold">
                        {files.length === 1 ? files[0].name : `${files.length} files selected: ${files.map(f => f.name).join(', ')}`}
                      </p>
                    )}
                  </div>
                  <input type="file" className="hidden" multiple onChange={(e) => setFiles([...e.target.files])} />
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-neonBlue to-neonPurple text-white font-bold hover:opacity-90 transition-opacity flex justify-center items-center gap-2"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Task'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
