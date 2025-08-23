import React, { useEffect, useMemo, useState } from 'react';
import './Pages.css';
import axios from 'axios';
import Cookies from 'js-cookie';
import { BACKEND_ADDRESS } from '../config/api';

function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleString();
}

export default function Polls() {
  const [polls, setPolls] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countsInput, setCountsInput] = useState({}); // key: `${pollId}:${idx}` -> number

  const token = (() => {
    const userCookie = Cookies.get('user');
    try { return userCookie ? JSON.parse(userCookie).token : null; } catch { return null; }
  })();

  const fetchPolls = async () => {
    try {
      setLoading(true);
      setError('');
      const resp = await axios.get(`${BACKEND_ADDRESS}/api/polls?all=1`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const list = resp.data?.polls || [];
      setPolls(list);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load polls');
    } finally {
      setLoading(false);
    }
  };

  const addVotes = async (pollId, optionIdx) => {
    const key = `${pollId}:${optionIdx}`;
    const n = parseInt(countsInput[key] || '1', 10);
    if (!n || n < 1) return;
    try {
      setError('');
      const resp = await axios.post(`${BACKEND_ADDRESS}/api/polls/${pollId}/vote`, { option: optionIdx, count: n }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resp.data?.success) {
        setPolls(prev => prev.map(p => p._id === pollId ? resp.data.poll : p));
      }
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to add votes');
    }
  };

  useEffect(() => { fetchPolls(); }, []);

  const filtered = useMemo(() => {
    return polls.filter(p => (p.question || '').toLowerCase().includes(query.toLowerCase()));
  }, [polls, query]);

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

  const toggleActive = async (id) => {
    try {
      setError('');
      const resp = await axios.patch(`${BACKEND_ADDRESS}/api/polls/${id}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resp.data?.success) {
        setPolls(prev => prev.map(p => p._id === id ? resp.data.poll : p));
      }
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to toggle poll');
    }
  };

  const deletePoll = async (id) => {
    if (!confirm('Delete this poll?')) return;
    try {
      setError('');
      await axios.delete(`${BACKEND_ADDRESS}/api/polls/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPolls(prev => prev.filter(p => p._id !== id));
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to delete poll');
    }
  };

  const resetVotes = async (id) => {
    if (!confirm('Reset all votes for this poll?')) return;
    try {
      setError('');
      const resp = await axios.post(`${BACKEND_ADDRESS}/api/polls/${id}/reset`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resp.data?.success) {
        setPolls(prev => prev.map(p => p._id === id ? resp.data.poll : p));
      }
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to reset votes');
    }
  };

  return (
    <div className="polls-container container">
      <div className="polls-header">
        <h1>Polls</h1>
        <a className="button-primary" href="/polls/new">Create Poll</a>
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
            <p>No polls found.</p>
          </div>
        )}
        {filtered.map(poll => {
          const total = poll.totalVotes || (poll.counts ? poll.counts.reduce((a,b) => a+b, 0) : 0);
          return (
            <div className="poll-card" key={poll._id}>
              <div className="poll-card-head">
                <h3 className="poll-question">{poll.question}</h3>
                <span className={"status-pill " + (poll.active ? 'active' : 'inactive')}>
                  {poll.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="poll-meta">Created {formatDate(poll.createdAt)} · {poll.options.length} options · {total} votes</div>

              <div className="poll-options">
                {poll.options.map((opt, idx) => {
                  const count = poll.counts ? (poll.counts[idx] || 0) : 0;
                  const pct = total ? Math.round((count / total) * 100) : 0;
                  const key = `${poll._id}:${idx}`;
                  const val = countsInput[key] ?? '';
                  return (
                    <div className="option-row" key={idx}>
                      <div className="option-label">{opt}</div>
                      <div className="option-progress">
                        <div className="bar" style={{ width: pct + '%' }} />
                      </div>
                      <div className="option-stats">{count} ({pct}%)</div>
                      <div className="option-admin-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="number"
                          min="1"
                          placeholder="count"
                          value={val}
                          onChange={e => setCountsInput(prev => ({ ...prev, [key]: e.target.value }))}
                          style={{ width: 80 }}
                          className="form-control"
                        />
                        <button className="btn-outline" onClick={() => addVotes(poll._id, idx)}>Add votes</button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="poll-actions">
                <button className="button-primary" onClick={() => toggleActive(poll._id)}>
                  {poll.active ? 'Deactivate' : 'Activate'}
                </button>
                <button className="btn-danger" onClick={() => resetVotes(poll._id)}>Reset Votes</button>
                <button className="btn-outline" onClick={() => deletePoll(poll._id)}>Delete</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
