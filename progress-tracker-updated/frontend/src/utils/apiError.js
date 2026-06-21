export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const detail = error?.response?.data?.detail;

  if (typeof detail === 'string') return detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item?.msg || item?.message || String(item))
      .join(', ');
  }

  if (error?.message === 'Network Error') {
    return 'Unable to reach the server. Check your connection.';
  }

  return fallback;
}
