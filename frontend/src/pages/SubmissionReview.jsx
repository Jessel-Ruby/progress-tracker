import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import { getErrorMessage } from '../utils/apiError';
import { formatDate, isImage } from '../utils/dateFormatters';
import { ArrowLeft, FileText, ExternalLink, Clock, User, MessageSquare } from 'lucide-react';

export default function SubmissionReview() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [actionLoading, setActionLoading] = useState(null); // 'approve' | 'revision' | 'reject'

  useEffect(() => {
    const fetchSubmission = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/tasks/submissions/${id}`);
        setSubmission(res.data);
      } catch (err) {
        toast.error(getErrorMessage(err, 'Failed to load submission'));
      } finally {
        setLoading(false);
      }
    };
    fetchSubmission();
  }, [id]);

  const handleApprove = async () => {
    setActionLoading('approve');
    try {
      await api.post(`/tasks/submissions/${id}/approve`);
      toast.success('Submission approved!');
      navigate(-1);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to approve submission'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevision = async () => {
    if (!feedback.trim()) {
      toast.error('Please provide feedback when requesting a revision.');
      return;
    }
    setActionLoading('revision');
    try {
      await api.post(`/tasks/submissions/${id}/reject?reason=revision`, {
        feedback: feedback.trim(),
      });
      toast.success('Revision requested — submitter has been notified.');
      navigate(-1);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to request revision'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    setActionLoading('reject');
    try {
      await api.post(`/tasks/submissions/${id}/reject`, {
        feedback: feedback.trim() || null,
      });
      toast.success('Submission rejected.');
      navigate(-1);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to reject submission'));
    } finally {
      setActionLoading(null);
    }
  };


  // Loading state
  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="glass-panel p-8 animate-pulse">
          <div className="h-6 bg-white/10 rounded w-1/3 mb-6" />
          <div className="space-y-4">
            <div className="h-4 bg-white/10 rounded w-1/2" />
            <div className="h-4 bg-white/10 rounded w-2/3" />
            <div className="h-4 bg-white/10 rounded w-1/4" />
          </div>
          <div className="h-32 bg-white/10 rounded mt-8" />
          <div className="flex gap-3 mt-8">
            <div className="h-10 bg-white/10 rounded flex-1" />
            <div className="h-10 bg-white/10 rounded flex-1" />
            <div className="h-10 bg-white/10 rounded flex-1" />
          </div>
        </div>
      </div>
    );
  }

  // Error / not found state
  if (!submission) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="glass-panel p-8 text-center">
          <p className="text-red-400 text-lg mb-4">Submission not found.</p>
          <button
            onClick={() => navigate(-1)}
            className="text-neonBlue hover:underline inline-flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Back to Admin
          </button>
        </div>
      </div>
    );
  }

  const statusColors = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    approved: 'bg-green-500/20 text-green-400 border-green-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  const isAlreadyReviewed = submission.status !== 'pending';

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-white transition-colors inline-flex items-center gap-2 mb-4 text-sm"
        >
          <ArrowLeft size={16} /> Back to Submissions
        </button>
        <h1 className="text-2xl font-bold text-white">Review Submission</h1>
      </motion.div>

      {/* Submission Details Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-panel p-6 mb-6"
      >
        {/* Task title + status badge */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 pb-4 border-b border-white/10">
          <h2 className="text-xl font-bold text-[#9AD872]">{submission.task_title}</h2>
          <span
            className={`text-xs px-3 py-1 rounded-full border font-semibold uppercase tracking-wider w-fit ${
              statusColors[submission.status] || 'bg-white/10 text-gray-400'
            }`}
          >
            {submission.status}
          </span>
        </div>

        {/* Meta information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <div className="p-2 rounded-lg bg-neonBlue/10">
              <User size={16} className="text-neonBlue" />
            </div>
            <div>
              <p className="text-gray-500 text-xs">Submitted by</p>
              <p className="text-white font-medium">{submission.submitter_username}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-400">
            <div className="p-2 rounded-lg bg-neonPurple/10">
              <Clock size={16} className="text-neonPurple" />
            </div>
            <div>
              <p className="text-gray-500 text-xs">Submitted on</p>
              <p className="text-white font-medium">{formatDate(submission.submitted_at)}</p>
            </div>
          </div>
        </div>

        {/* Comment */}
        {submission.comment && (
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <MessageSquare size={14} />
              <span>Submitter's Comment</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                {submission.comment}
              </p>
            </div>
          </div>
        )}

        {/* File attachment */}
        {submission.file_path && (
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <FileText size={14} />
              <span>Attached File</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              {isImage(submission.file_path) ? (
                <div className="space-y-3">
                  <img
                    src={submission.file_path}
                    alt="Submission attachment"
                    className="max-h-64 rounded-lg border border-white/10 object-contain"
                  />
                  <a
                    href={submission.file_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-neonBlue text-sm hover:underline"
                  >
                    <ExternalLink size={14} />
                    Open full image
                  </a>
                </div>
              ) : (
                <a
                  href={submission.file_path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 text-neonBlue hover:underline text-sm"
                >
                  <div className="p-2 rounded-lg bg-neonBlue/10">
                    <FileText size={18} className="text-neonBlue" />
                  </div>
                  <span>View / Download File</span>
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Feedback + Actions Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-panel p-6"
      >
        {isAlreadyReviewed ? (
          <div className="text-center py-4">
            <p className="text-gray-400 mb-2">
              This submission has already been <strong className="text-white">{submission.status}</strong>.
            </p>
            {submission.feedback && (
              <div className="mt-4 bg-white/5 border border-white/10 rounded-lg p-4 text-left">
                <p className="text-xs text-gray-500 mb-1">Feedback given</p>
                <p className="text-gray-300 text-sm">{submission.feedback}</p>
              </div>
            )}
          </div>
        ) : (
          <>
            <h3 className="text-lg font-semibold text-white mb-4">Feedback & Actions</h3>

            <div className="mb-6">
              <label htmlFor="review-feedback" className="block text-sm text-gray-400 mb-2">
                Feedback <span className="text-gray-600">(required for revision request)</span>
              </label>
              <textarea
                id="review-feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Provide feedback for the submitter..."
                rows={4}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white placeholder-gray-600 focus:outline-none focus:border-neonBlue transition-colors resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                id="btn-approve"
                type="button"
                disabled={!!actionLoading}
                onClick={handleApprove}
                className="flex-1 py-3 px-4 rounded-lg bg-green-500/20 text-green-400 border border-green-500/30 font-semibold hover:bg-green-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === 'approve' ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                    Approving…
                  </span>
                ) : (
                  '✓ Approve'
                )}
              </button>

              <button
                id="btn-request-revision"
                type="button"
                disabled={!!actionLoading}
                onClick={handleRevision}
                className="flex-1 py-3 px-4 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold hover:bg-amber-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === 'revision' ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    Requesting…
                  </span>
                ) : (
                  '⟳ Request Revision'
                )}
              </button>

              <button
                id="btn-reject"
                type="button"
                disabled={!!actionLoading}
                onClick={handleReject}
                className="flex-1 py-3 px-4 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 font-semibold hover:bg-red-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === 'reject' ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                    Rejecting…
                  </span>
                ) : (
                  '✕ Reject'
                )}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
