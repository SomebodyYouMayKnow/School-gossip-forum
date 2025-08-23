// Backend API configuration
const BACKEND_ADDRESS =
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_BACKEND_URL) ||
  (typeof window !== 'undefined' && window.ENV && window.ENV.BACKEND_URL) ||
  'http://localhost:5555';

export { BACKEND_ADDRESS };
