// Backend API configuration
const BACKEND_ADDRESS =
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_BACKEND_URL) ||
  (typeof window !== 'undefined' && window.ENV && window.ENV.BACKEND_URL) ||
  'http://3.128.25.225/api';

export { BACKEND_ADDRESS };
