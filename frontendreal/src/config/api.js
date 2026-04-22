// Backend API configuration
const BACKEND_ADDRESS =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_URL) ||
  (typeof window !== 'undefined' && window.ENV && window.ENV.BACKEND_URL) ||
  (typeof window !== 'undefined' && window.location && window.location.origin) ||
  'http://127.0.0.1:5555';

export { BACKEND_ADDRESS };
