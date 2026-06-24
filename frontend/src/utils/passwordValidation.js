export const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=[\]{}|;':",./<>?`~]/;
export const EMAIL_REGEX = /^[^\s@]+@[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

/**
 * Returns validation rules for password signup.
 * @param {string} pwd
 * @returns {Array<{key: string, label: string, met: boolean}>}
 */
export function getPasswordRules(pwd) {
  return [
    { key: 'minLen',    label: 'At least 8 characters',              met: pwd.length >= 8 },
    { key: 'maxLen',    label: 'No more than 12 characters',          met: pwd.length <= 12 },
    { key: 'uppercase', label: 'At least one uppercase letter (A–Z)', met: /[A-Z]/.test(pwd) },
    { key: 'number',    label: 'At least one number (0–9)',           met: /[0-9]/.test(pwd) },
    { key: 'special',   label: 'At least one special character (!@#$…)', met: SPECIAL_CHAR_REGEX.test(pwd) },
  ];
}

/**
 * Derives password strength description and score.
 * @param {Array<{met: boolean}>} rules
 * @returns {{score: number, label: string, color: string}}
 */
export function getStrengthFromRules(rules) {
  const metCount = rules.filter((r) => r.met).length;
  const total = rules.length;
  if (metCount === total) return { score: 3, label: 'Strong',    color: '#22c55e' };
  if (metCount >= 3)     return { score: 2, label: 'Medium',    color: '#eab308' };
  if (metCount >= 1)     return { score: 1, label: 'Weak',      color: '#f97316' };
  return                        { score: 0, label: 'Too Short', color: '#ef4444' };
}
