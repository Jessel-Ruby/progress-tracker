import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Camera, Upload, User, Zap, Target, Activity, Star } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';
import { getErrorMessage } from '../utils/apiError';

export default function Profile() {
  const { user, setUser } = useAuthStore();
  const fileInputRef = useRef(null);

  const [preview, setPreview] = useState(null);   // local blob URL before upload
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5 MB');
      return;
    }
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const res = await api.post('/auth/me/profile-image', formData);
      // Update global user in store so sidebar avatar refreshes immediately
      setUser(res.data);
      setSelectedFile(null);
      setPreview(null);
      toast.success('Profile photo updated!');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to upload profile photo'));
    } finally {
      setUploading(false);
    }
  };

  const displayImage = preview || user?.profile_image;

  const stats = [
    { label: 'Total XP', value: user?.xp ?? 0, icon: Zap, color: 'text-neonBlue', bg: 'bg-neonBlue/10' },
    { label: 'Level', value: user?.level ?? 1, icon: Target, color: 'text-neonPurple', bg: 'bg-neonPurple/10' },
    { label: 'Day Streak', value: user?.streak ?? 0, icon: Activity, color: 'text-neonGreen', bg: 'bg-neonGreen/10' },
    { label: 'Score', value: user?.contribution_score ?? 0, icon: Star, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  ];

  return (
    <div className="p-8 max-w-3xl mx-auto ">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">Profile Settings</h1>
        <p className="text-gray-400">Manage your account info and profile photo.</p>
      </motion.div>

      {/* Avatar card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass-panel p-8 mb-6 border-neonGreen"
      >
        <div className="flex flex-col sm:flex-row items-center gap-8 ">
          {/* Avatar preview */}
          <div className="relative shrink-0 group">
            <div
              className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-neonBlue/20 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              title="Click to choose a photo"
            >
              {displayImage ? (
                <img
                  src={displayImage}
                  alt={user?.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-neonBlue/30 to-neonPurple/30 flex items-center justify-center">
                  <User size={48} className="text-white/50" />
                </div>
              )}
              {/* hover overlay */}
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={28} className="text-white" />
              </div>
            </div>

            {/* hidden file input */}
            <input
              id="profile-image-input"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleFileChange}
            />
          </div>

          {/* Info + upload button */}
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-bold text-white mb-1">{user?.username}</h2>
            <p className="text-sm text-gray-400 mb-1">{user?.email}</p>
            <p className="text-xs text-gray-500 mb-4 capitalize">
              {user?.is_president ? 'President' : user?.is_vice_president ? 'Vice President' : user?.role === 'hod' ? 'HOD' : 'Member'}
            </p>

            <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
              <button
                id="choose-photo-btn"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-all"
              >
                <Camera size={16} />
                Choose Photo
              </button>

              {selectedFile && (
                <button
                  id="upload-photo-btn"
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neonBlue text-black font-semibold text-sm hover:bg-opacity-90 transition-all disabled:opacity-50"
                >
                  <Upload size={16} />
                  {uploading ? 'Uploading...' : 'Save Photo'}
                </button>
              )}
            </div>

            {selectedFile && (
              <p className="mt-2 text-xs text-gray-500">
                Selected: <span className="text-gray-300">{selectedFile.name}</span>
              </p>
            )}

            <p className="mt-3 text-xs text-gray-600">
              Accepted formats: JPEG, PNG, WebP · Max 5 MB
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
      >
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="glass-panel p-5 flex flex-col items-center gap-2">
            <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center`}>
              <Icon size={20} className={color} />
            </div>
            <span className={`text-2xl font-extrabold ${color}`}>{value}</span>
            <span className="text-xs text-gray-500 text-center">{label}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
