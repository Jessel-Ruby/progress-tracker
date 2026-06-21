import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { UploadCloud, CheckCircle, FileAudio } from 'lucide-react';
import api from '../services/api';
import { getErrorMessage } from '../utils/apiError';

export default function TaskDetail() {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [file, setFile] = useState(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingTask, setIsLoadingTask] = useState(true);

  useEffect(() => {
    const fetchTask = async () => {
      setIsLoadingTask(true);
      try {
        const res = await api.get(`/tasks/${id}`);
        setTask(res.data);
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
    if (file) formData.append('file', file);
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
      setFile(null);
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
            <span className={`px-3 py-1 text-sm rounded-full ${
              task.status === 'completed' ? 'bg-green-500/20 text-green-400' :
              task.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
              'bg-yellow-500/20 text-yellow-400'
            }`}>
              {task.status.replace('_', ' ').toUpperCase()}
            </span>
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
              <audio controls className="w-full h-10">
                <source src={`http://localhost:8000/${task.voice_note_path}`} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>
          </div>
        )}

        <hr className="border-white/10 my-8" />

        <h3 className="text-xl font-bold mb-4">Submit Work</h3>
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
                    {file && <p className="text-sm text-neonGreen font-semibold">{file.name}</p>}
                  </div>
                  <input type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
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
