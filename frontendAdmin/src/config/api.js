// Backend API configuration
const BACKEND_ADDRESS =
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_BACKEND_URL) ||
  (typeof window !== 'undefined' && window.ENV && window.ENV.BACKEND_URL) ||
  'https://dailysoup.ink/api';

export { BACKEND_ADDRESS };
