/**
 * Formats a submitted at relative time.
 * @param {string} iso
 * @returns {string}
 */
export const formatSubmittedAt = (iso) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

/**
 * Formats a date to locale string with time.
 * @param {string} iso
 * @returns {string}
 */
export const formatDate = (iso) => {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Checks if path is an image file.
 * @param {string} path
 * @returns {boolean}
 */
export const isImage = (path) => {
  if (!path) return false;
  return /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?|$)/i.test(path);
};
