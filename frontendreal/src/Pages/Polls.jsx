import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { BACKEND_ADDRESS } from '../config/api';
import './Pages.css';
import { useNavigate } from 'react-router-dom';

function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleString();
}

export default function PublicPolls() {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [ideasPost, setIdeasPost] = useState(null);
  const navigate = useNavigate();

  const token = (() => {
    const c = Cookies.get('user');
    try { return c ? JSON.parse(c).token : null; } catch { return null; }
  })();

  const isLoggedIn = !!token;

  const fetchPolls = async () => {
    try {
      setLoading(true);
      setError('');
      const resp = await axios.get(`${BACKEND_ADDRESS}/api/polls`);
      setPolls(resp.data?.polls || []);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load polls');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPolls(); }, []);

  // Fetch or create the centralized Poll Ideas post
  useEffect(() => {
    (async () => {
      try {
        const resp = await axios.get(`${BACKEND_ADDRESS}/api/polls/ideas`);
        if (resp.data?.success && resp.data?.post) setIdeasPost(resp.data.post);
      } catch (e) {
        // non-blocking; ignore errors
      }
    })();
  }, []);

  const filtered = useMemo(() => polls.filter(p => (p.question || '').toLowerCase().includes(query.toLowerCase())), [polls, query]);

  const getCounts = (poll) => {
    if (Array.isArray(poll.counts) && poll.counts.length) return poll.counts;
    const counts = new Array(poll.options?.length || 0).fill(0);
    if (Array.isArray(poll.votes)) {
      for (const v of poll.votes) {
        const idx = typeof v.option === 'number' ? v.option : -1;
        if (idx >= 0 && idx < counts.length) counts[idx] += 1;
      }
    }
    return counts;
  };

  const openPoll = (pollId) => {
    navigate(`/polls/${pollId}`);
  };

  return (
    <div className="polls-container container">
      <div className="polls-header">
        <h1>Community Polls</h1>
      </div>

      {ideasPost && (
        <div className="poll-ideas-banner" style={{
          border: '1px solid #cde',
          background: '#f3f8ff',
          padding: 12,
          borderRadius: 8,
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          <div style={{fontSize: 22}}>💡</div>
          <div style={{flex: 1}}>
            <div style={{fontWeight: 600}}>Have an idea for a poll?</div>
            <div>Comment your suggestions on the Poll Ideas thread.</div>
          </div>
          <button
            className="button-primary"
            onClick={() => navigate(`/posts?postid=${ideasPost._id}`)}
          >Open Poll Ideas</button>
        </div>
      )}

      <div className="polls-toolbar">
        <input
          className="form-control"
          placeholder="Search polls by question..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {error && (<div className="error-message">{error}</div>)}
      {loading && (<div className="status-message"><p>Loading polls…</p></div>)}

      <div className="polls-list">
        {!loading && filtered.length === 0 && (
          <div className="empty-state">
            <p>No polls available.</p>
          </div>
        )}
        {filtered.map(poll => {
          const counts = getCounts(poll);
          const total = counts.reduce((a,b) => a+b, 0);
          return (
            <div className="poll-card" key={poll._id}>
              <div className="poll-card-head" style={{ cursor: 'pointer' }} onClick={() => openPoll(poll._id)}>
                <h3 className="poll-question">{poll.question}</h3>
              </div>
              {Array.isArray(poll.images) && poll.images.length > 0 && (
                <div className="poll-thumbs" style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {poll.images.slice(0, 4).map((imagePath, idx) => (
                    <img
                      key={idx}
                      src={`${BACKEND_ADDRESS}/uploads/${imagePath}`}
                      alt={`Poll thumbnail ${idx + 1}`}
                      style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6, border: '1px solid #ddd' }}
                    />
                  ))}
                  {poll.images.length > 4 && (
                    <div style={{
                      width: 64,
                      height: 64,
                      borderRadius: 6,
                      border: '1px solid #ddd',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#f7f7f7',
                      color: '#555',
                      fontSize: 14
                    }}>
                      +{poll.images.length - 4}
                    </div>
                  )}
                </div>
              )}
              <div className="poll-meta">{poll.options.length} options · {total} total votes</div>

              <div className="poll-options">
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
                    </div>
                  );
                })}
              </div>
              <div className="poll-actions" style={{ marginTop: 12 }}>
                <button className="button-primary" onClick={() => openPoll(poll._id)}>Open Poll</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
