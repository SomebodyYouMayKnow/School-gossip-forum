import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import './Pages.css';
import { BACKEND_ADDRESS } from '../config/api';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

const ResetPassword = () => {
  const q = useQuery();
  const token = q.get('token');
  const navigate = useNavigate();

  // Request form state
  const [email, setEmail] = useState('');
  const [reqStatus, setReqStatus] = useState({ loading: false, msg: '' });

  // Confirm form state
  const [newPassword, setNewPassword] = useState('');
  const [confirmStatus, setConfirmStatus] = useState({ loading: false, msg: '' });

  const passwordRegex = /^[A-Za-z0-9!@#$%^&*()_]{1,20}$/;

  const submitRequest = async (e) => {
    e.preventDefault();
    if (!email) return setReqStatus({ loading: false, msg: 'Please enter your email.' });
    setReqStatus({ loading: true, msg: '' });
    try {
      await axios.post(`${BACKEND_ADDRESS}/api/password-reset/request`, { email }, { headers: { 'Content-Type': 'application/json' } });
      setReqStatus({ loading: false, msg: 'If an account exists for that email, a reset link has been sent.' });
    } catch (e) {
      setReqStatus({ loading: false, msg: 'If an account exists for that email, a reset link has been sent.' });
    }
  };

  const submitConfirm = async (e) => {
    e.preventDefault();
    if (!passwordRegex.test(newPassword)) {
      return setConfirmStatus({ loading: false, msg: 'Password must be 1-20 chars and use allowed characters.' });
    }
    setConfirmStatus({ loading: true, msg: '' });
    try {
      const res = await axios.post(`${BACKEND_ADDRESS}/api/password-reset/confirm`, { token, newPassword }, { headers: { 'Content-Type': 'application/json' } });
      if (res.data && res.data.success) {
        setConfirmStatus({ loading: false, msg: 'Password reset successful. Redirecting to login...' });
        setTimeout(() => navigate('/Login'), 1200);
      } else {
        setConfirmStatus({ loading: false, msg: res.data?.message || 'Reset failed.' });
      }
    } catch (e2) {
      setConfirmStatus({ loading: false, msg: 'Reset token invalid or expired.' });
    }
  };

  if (token) {
    return (
      <div className="Forms_Sign_In">
        <h2>Set New Password</h2>
        <form className="row g-3" onSubmit={submitConfirm}>
          <div className="col-md-12">
            <label htmlFor="newPassword" className="form-label">New Password</label>
            <input id="newPassword" type="password" className="form-control" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div className="col-12">
            <button type="submit" className="button-submit" disabled={confirmStatus.loading}>
              {confirmStatus.loading ? 'Saving...' : 'Reset Password'}
            </button>
          </div>
          {confirmStatus.msg && (
            <div className="col-12"><div className="alert-info">{confirmStatus.msg}</div></div>
          )}
        </form>
      </div>
    );
  }

  return (
    <div className="Forms_Sign_In">
      <h2>Forgot Password</h2>
      <form className="row g-3" onSubmit={submitRequest}>
        <div className="col-md-12">
          <label htmlFor="email" className="form-label">Email</label>
          <input id="email" type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="col-12">
          <button type="submit" className="button-submit" disabled={reqStatus.loading}>
            {reqStatus.loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </div>
        {reqStatus.msg && (
          <div className="col-12"><div className="alert-info">{reqStatus.msg}</div></div>
        )}
      </form>
    </div>
  );
};

export default ResetPassword;
