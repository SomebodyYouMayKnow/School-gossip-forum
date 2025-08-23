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

  const vote = async (pollId, optionIdx) => {
    if (!isLoggedIn) {
      alert('Please login to vote.');
      navigate('/Login');
      return;
    }
    try {
      setError('');
      const resp = await axios.post(`${BACKEND_ADDRESS}/api/polls/${pollId}/vote`, { option: optionIdx }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resp.data?.success) {
        setPolls(prev => prev.map(p => p._id === pollId ? resp.data.poll : p));
      } else {
        setError(resp.data?.message || 'Failed to vote');
      }
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to vote');
    }
  };

  return (
    <div className="polls-container container">
      <div className="polls-header">
        <h1>Community Polls</h1>
      </div>

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
              <div className="poll-card-head">
                <h3 className="poll-question">{poll.question}</h3>
              </div>
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
                      <div className="option-actions">
                        <button className="button-primary" onClick={() => vote(poll._id, idx)}>Vote</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
