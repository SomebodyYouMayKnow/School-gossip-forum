import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useNavigate, useParams } from 'react-router-dom';
import { BACKEND_ADDRESS } from '../config/api';
import './Pages.css';

function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleString();
}

export default function PollDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const token = (() => {
    const c = Cookies.get('user');
    try { return c ? JSON.parse(c).token : null; } catch { return null; }
  })();

  const isLoggedIn = !!token;

  const fetchPoll = async () => {
    try {
      setLoading(true);
      setError('');
      const resp = await axios.get(`${BACKEND_ADDRESS}/api/polls/${id}`);
      if (resp.data?.success) setPoll(resp.data.poll); else setError('Failed to load poll');
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load poll');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPoll(); /* eslint-disable-next-line */ }, [id]);

  const counts = useMemo(() => {
    if (!poll) return [];
    if (Array.isArray(poll.counts)) return poll.counts;
    const arr = new Array(poll.options?.length || 0).fill(0);
    if (Array.isArray(poll.votes)) {
      for (const v of poll.votes) {
        const idx = typeof v.option === 'number' ? v.option : -1;
        if (idx >= 0 && idx < arr.length) arr[idx] += 1;
      }
    }
    return arr;
  }, [poll]);

  const total = counts.reduce((a,b) => a+b, 0);

  const handleVote = async (optionIdx) => {
    if (!isLoggedIn) {
      alert('Please login to vote.');
      navigate('/Login');
      return;
    }
    try {
      setError('');
      const resp = await axios.post(`${BACKEND_ADDRESS}/api/polls/${id}/vote`, { option: optionIdx }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resp.data?.success) {
        setPoll(resp.data.poll);
      } else {
        setError(resp.data?.message || 'Failed to vote');
      }
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to vote');
    }
  };

  if (loading) return (<div className="container"><p>Loading poll…</p></div>);
  if (error) return (<div className="container"><div className="error-message">{error}</div></div>);
  if (!poll) return null;

  return (
    <div className="container">
      <div className="poll-detail">
        <button className="btn-outline" onClick={() => navigate(-1)}>&larr; Back</button>
        <h1 style={{ marginTop: 12 }}>{poll.question}</h1>
        <div className="poll-meta">Created {formatDate(poll.createdAt)} · {poll.options.length} options</div>

        {poll.description && (
          <div className="poll-description" style={{ marginTop: 16, whiteSpace: 'pre-wrap' }}>
            {poll.description}
          </div>
        )}

        {Array.isArray(poll.images) && poll.images.length > 0 && (
          <div className="post-images" style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {poll.images.map((imagePath, index) => (
                <img
                  key={index}
                  src={`${BACKEND_ADDRESS}/uploads/${imagePath}`}
                  alt={`Poll image ${index + 1}`}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '400px',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                  onClick={() => {
                    window.open(`${BACKEND_ADDRESS}/uploads/${imagePath}`, '_blank');
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div className="poll-options" style={{ marginTop: 20 }}>
          {poll.options.map((opt, idx) => {
            const count = counts[idx] || 0;
            const pct = total ? Math.round((count / total) * 100) : 0;
            return (
              <div className="option-block" key={idx}>
                <div className="option-top">
                  <div className="option-label">{opt}</div>
                  <div className="option-stats">{count} votes · {pct}%</div>
                </div>
                <div className="option-progress">
                  <div className="bar" style={{ width: pct + '%' }} />
                </div>
                <div className="option-actions">
                  <button className="button-primary" onClick={() => handleVote(idx)}>Vote</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
