import api from '../lib/api';

// Pre-signup email verification — no auth token exists yet at this point,
// matching server/src/routes/otp.routes.js (no auth middleware).
export const otpService = {
  request: async (email) => (await api.post('/otp/request', { email })).data,
  verify: async (email, otp) => (await api.post('/otp/verify', { email, otp })).data,
};

export default otpService;
