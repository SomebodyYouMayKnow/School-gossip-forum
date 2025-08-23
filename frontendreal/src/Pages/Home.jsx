import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import Cookies from 'js-cookie'
import { BACKEND_ADDRESS } from '../config/api'
import './Pages.css'

function formatDate(ts) {
  if (!ts) return '';
  try { return new Date(ts).toLocaleString(); } catch { return '' }
}

const Home = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [latestPoll, setLatestPoll] = useState(null);
  const [latestPost, setLatestPost] = useState(null);
  const [recentChats, setRecentChats] = useState([]);

  // derive counts for poll options if missing
  const pollCounts = useMemo(() => {
    const p = latestPoll;
    if (!p) return [];
    if (Array.isArray(p.counts) && p.counts.length) return p.counts;
    const counts = new Array(p.options?.length || 0).fill(0);
    if (Array.isArray(p.votes)) {
      for (const v of p.votes) {
        const idx = typeof v.option === 'number' ? v.option : -1;
        if (idx >= 0 && idx < counts.length) counts[idx] += 1;
      }
    }
    return counts;
  }, [latestPoll]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch polls list, pick most recent
        const pollsResp = await axios.get(`${BACKEND_ADDRESS}/api/polls`);
        const polls = pollsResp.data?.polls || [];
        let recentPoll = null;
        if (polls.length > 0) {
          recentPoll = [...polls].sort((a, b) => {
            const da = new Date(a.createdAt || a.updatedAt || 0).getTime();
            const db = new Date(b.createdAt || b.updatedAt || 0).getTime();
            return db - da;
          })[0];
        }
        setLatestPoll(recentPoll || null);

        // Fetch most recent post (limit 1)
        const postsResp = await axios.get(`${BACKEND_ADDRESS}/api/recent-posts?limit=1&skip=0&sortBy=recent&order=desc`);
        const post = postsResp.data?.posts?.[0] || null;
        setLatestPost(post);

        // Fetch 3 most recent GENERAL chat messages
        try {
          const chatResp = await axios.get(`${BACKEND_ADDRESS}/api/chat/recent?room=general&limit=3`);
          setRecentChats(Array.isArray(chatResp.data?.messages) ? chatResp.data.messages : []);
        } catch (e2) {
          // Non-fatal
          console.warn('Failed to fetch recent chats', e2?.message || e2);
          setRecentChats([]);
        }
      } catch (e) {
        setError(e.response?.data?.message || e.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stripHtml = (html) => {
    const div = document.createElement('div');
    div.innerHTML = html || '';
    return div.textContent || div.innerText || '';
  };

  return (
    <div className="container" style={{maxWidth: 1100}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,marginBottom:16}}>
        <h1 style={{margin:0}}>Dashboard</h1>
        <div style={{display:'flex',gap:8}}>
          <button className="button-secondary" onClick={() => navigate('/polls')}>All Polls</button>
          <button className="button-secondary" onClick={() => navigate('/viewposts')}>All Posts</button>
        </div>
      </div>

      {error && (
        <div className="error-message" style={{marginBottom:12}}>{error}</div>
      )}
      {loading && (
        <div className="status-message" style={{marginBottom:12}}>Loading…</div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:16}}>
        {/* Left column: stack Poll and Post */}
        <div style={{display:'flex', flexDirection:'column', gap:16}}>
          {/* Latest Poll */}
          <div className="poll-card" style={{border:'1px solid #e5e7eb'}}>
          <div className="poll-card-head" style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <h3 style={{margin:0}}>Latest Poll</h3>
            {latestPoll && (
              <button className="button-primary" onClick={() => navigate(`/polls/${latestPoll._id}`)}>View Poll</button>
            )}
          </div>
          {!latestPoll && !loading && (
            <div className="empty-state"><p>No polls yet.</p></div>
          )}
          {latestPoll && (
            <div>
              <h2 className="poll-question" style={{marginTop:8}}>{latestPoll.question}</h2>
              {Array.isArray(latestPoll.images) && latestPoll.images.length > 0 && (
                <div className="poll-thumbs" style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {latestPoll.images.slice(0, 4).map((imagePath, idx) => (
                    <img
                      key={idx}
                      src={`${BACKEND_ADDRESS}/uploads/${imagePath}`}
                      alt={`Poll thumbnail ${idx + 1}`}
                      style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6, border: '1px solid #ddd' }}
                    />
                  ))}
                  {latestPoll.images.length > 4 && (
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
                    }}>+{latestPoll.images.length - 4}</div>
                  )}
                </div>
              )}
              <div className="poll-options" style={{marginTop:8}}>
                {latestPoll.options?.slice(0, 3).map((opt, idx) => {
                  const counts = pollCounts;
                  const total = counts.reduce((a,b) => a+b, 0);
                  const count = counts[idx] || 0;
                  const pct = total ? Math.round((count / total) * 100) : 0;
                  return (
                    <div className="option-block" key={idx}>
                      <div className="option-top">
                        <div className="option-label">{opt}</div>
                        <div className="option-stats">{count} votes · {pct}%</div>
                      </div>
                      <div className="option-progress"><div className="bar" style={{ width: pct + '%' }} /></div>
                    </div>
                  );
                })}
                {latestPoll.options?.length > 3 && (
                  <div style={{color:'#666', fontSize:13, marginTop:6}}>+{latestPoll.options.length - 3} more options</div>
                )}
              </div>
            </div>
          )}
          </div>

          {/* Latest Post */}
          <div className="post-card" style={{border:'1px solid #e5e7eb'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <h3 style={{margin:0}}>Latest Post</h3>
            {latestPost && (
              <button className="button-primary" onClick={() => navigate(`/posts?postid=${latestPost._id}`)}>Read Post</button>
            )}
          </div>
          {!latestPost && !loading && (
            <div className="empty-state"><p>No posts yet.</p></div>
          )}
          {latestPost && (
            <div style={{cursor:'pointer'}} onClick={() => navigate(`/posts?postid=${latestPost._id}`)}>
              <h2 className="post-title" style={{marginTop:8}}>{latestPost.postTitle}</h2>
              <div className="post-meta">
                By {latestPost.fullName} on {formatDate(latestPost.creationDate)}
                {latestPost.category && (
                  <span style={{
                    marginLeft: '12px',
                    background: '#e9ecef',
                    color: '#495057',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.85em',
                    fontWeight: '500'
                  }}>
                    📂 {latestPost.category}
                  </span>
                )}
              </div>
              <div className="post-content post-preview" style={{marginTop:6}}>
                {stripHtml(latestPost.postContent).slice(0, 200)}{stripHtml(latestPost.postContent).length > 200 ? '…' : ''}
              </div>
              {latestPost.images && latestPost.images.length > 0 && (
                <div className="post-images" style={{ marginTop: '12px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {latestPost.images.slice(0, 3).map((imagePath, index) => (
                      <img
                        key={index}
                        src={`${BACKEND_ADDRESS}/uploads/${imagePath}`}
                        alt={`Post image ${index + 1}`}
                        style={{
                          maxWidth: '160px',
                          maxHeight: '160px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '1px solid #ddd'
                        }}
                      />
                    ))}
                    {latestPost.images.length > 3 && (
                      <div style={{
                        width: 160,
                        height: 160,
                        borderRadius: 8,
                        border: '1px solid #ddd',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#f7f7f7',
                        color: '#555',
                        fontSize: 14
                      }}>+{latestPost.images.length - 3}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          </div>
        </div>

        {/* Right Sidebar: Recent General Chats */}
        <aside className="card" style={{border:'1px solid #e5e7eb', height:'fit-content'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <h3 style={{margin:0}}>Recent Chat (General)</h3>
            <button className="button-secondary" onClick={() => navigate('/chat')}>Open Chat</button>
          </div>
          {recentChats.length === 0 && !loading && (
            <div className="empty-state"><p>No recent messages.</p></div>
          )}
          <div style={{marginTop:8, display:'flex', flexDirection:'column', gap:8}}>
            {recentChats.map((m, idx) => {
              const isAdmin = !!m.admin;
              return (
                <div key={idx} style={{background:'#fff', border:'1px solid #e5e7eb', borderRadius:6, padding:'8px 10px'}}>
                  <div style={{display:'flex', alignItems:'baseline', gap:8}}>
                    <b style={isAdmin ? { color:'#b91c1c' } : undefined}>{m.user || 'Anonymous'}{isAdmin ? ' (Admin)' : ''}</b>
                    <span style={{color:'#888', fontSize:12}}>{formatDate(m.ts)}</span>
                  </div>
                  <div style={{whiteSpace:'pre-wrap', fontWeight: isAdmin ? '700' : '400', color: isAdmin ? '#b91c1c' : 'inherit'}}>
                    {m.text}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{marginTop:10, fontSize:12, color:'#666'}}>
            To send a message, go to Chat.
          </div>
        </aside>
      </div>
    </div>
  )
}

export default Home