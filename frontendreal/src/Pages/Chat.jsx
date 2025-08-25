import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { io } from 'socket.io-client';
import { BACKEND_ADDRESS } from '../config/api';
import './Pages.css';

function getUserDisplay() {
  try {
    const c = Cookies.get('user');
    if (!c) return 'Anonymous';
    const u = JSON.parse(c);
    return u.fullName || u.username || 'Anonymous';
  } catch {
    return 'Anonymous';
  }
}

export default function Chat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [room, setRoom] = useState('general');
  const [status, setStatus] = useState('connecting');
  const [lastError, setLastError] = useState('');
  const listRef = useRef(null);
  const [nextSendAt, setNextSendAt] = useState(0);
  const [cooldownLeft, setCooldownLeft] = useState(0);

  // Connect directly to backend Socket.IO using configured backend address
  const socket = useMemo(() => io(BACKEND_ADDRESS, {
    withCredentials: true,
    transports: ['websocket', 'polling'],
    path: '/socket.io'
  }), []);

  // Load saved room on first mount
  useEffect(() => {
    try {
      const saved = (localStorage.getItem('chatRoom') || '').toLowerCase();
      const allowed = new Set(['general', 'sports', 'news', 'teachers', 'school-bullshit']);
      if (allowed.has(saved)) setRoom(saved);
    } catch {}
  }, []);

  useEffect(() => {
    setStatus('connecting');
    // Ensure the socket is (re)connecting
    try { socket.connect(); } catch {}
    socket.on('connect', () => {
      setStatus('connected');
      setLastError('');
    });
    socket.on('disconnect', () => setStatus('disconnected'));
    socket.on('connect_error', (err) => {
      setStatus('disconnected');
      setLastError(String(err?.message || err));
      // retry with a small delay
      setTimeout(() => socket.connect(), 1000);
    });
    socket.on('error', (err) => setLastError(String(err?.message || err)));

    socket.on('chat:init', (buf) => {
      if (Array.isArray(buf)) setMessages(buf);
    });
    socket.on('chat:message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });
    socket.on('chat:rate_limit', ({ waitMs }) => {
      if (typeof waitMs === 'number' && waitMs > 0) {
        const until = Date.now() + waitMs;
        setNextSendAt(prev => Math.max(prev || 0, until));
      }
    });

    // If it already connected before listeners were added, reflect state
    if (socket.connected) {
      setStatus('connected');
    }

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('error');
      socket.off('chat:init');
      socket.off('chat:message');
      socket.off('chat:rate_limit');
      socket.close();
    };
  }, [socket]);

  // Join selected room when socket connects or room changes
  useEffect(() => {
    if (!socket) return;
    try {
      socket.emit('chat:join', room);
    } catch {}
  }, [socket, room]);

  // Clear messages when room changes (history will refill from chat:init)
  useEffect(() => {
    setMessages([]);
    try { localStorage.setItem('chatRoom', room); } catch {}
  }, [room]);

  useEffect(() => {
    // auto-scroll to bottom on new messages
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  // Cooldown ticker
  useEffect(() => {
    if (!nextSendAt) return;
    const id = setInterval(() => {
      const leftMs = Math.max(0, nextSendAt - Date.now());
      setCooldownLeft(Math.ceil(leftMs / 1000));
      if (leftMs <= 0) {
        setNextSendAt(0);
        clearInterval(id);
      }
    }, 200);
    return () => clearInterval(id);
  }, [nextSendAt]);

  const sendMessage = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    // Block while in cooldown
    if (nextSendAt && Date.now() < nextSendAt) return;
    if (!trimmed) return;
    socket.emit('chat:message', { text: trimmed, user: getUserDisplay(), room });
    setText('');
    // Start 3s cooldown
    setNextSendAt(Date.now() + 3000);
  };

  return (
    <div className="container" style={{maxWidth: 900}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,marginBottom:12}}>
        <h1 style={{margin:0}}>Live Chat</h1>
        <div style={{fontSize: 14, color: status === 'connected' ? '#16a34a' : status === 'connecting' ? '#d97706' : '#b91c1c'}}>
          {status === 'connected' ? '● Connected' : status === 'connecting' ? '● Connecting…' : '● Disconnected'}
        </div>
      </div>

      <div style={{marginBottom:10, display:'flex', gap:8, alignItems:'center'}}>
        <label htmlFor="roomSel" style={{fontSize:14, color:'#444'}}>Category:</label>
        <select id="roomSel" className="form-control" style={{maxWidth:240}} value={room} onChange={e => setRoom(e.target.value)}>
          <option value="general">General</option>
          <option value="sports">Sports</option>
          <option value="news">News</option>
          <option value="teachers">Teachers</option>
          <option value="school-bullshit">School Bullshit</option>
        </select>
      </div>

      <div className="card" style={{padding:0, border:'1px solid #e5e7eb', borderRadius:8, overflow:'hidden'}}>
        <div ref={listRef} style={{height: '50vh', overflowY: 'auto', padding: 12, background:'#fafafa'}}>
          {messages.length === 0 && (
            <div className="empty-state"><p>No messages yet. Say hi!</p></div>
          )}
          {messages.map(m => {
            const isAdmin = !!m.admin;
            return (
              <div key={m.id} style={{
                background:'#fff',
                border:'1px solid #e5e7eb',
                borderRadius:6,
                padding:'8px 10px',
                marginBottom:8
              }}>
                <div style={{display:'flex', alignItems:'baseline', gap:8}}>
                  <b style={isAdmin ? { color: '#b91c1c' } : undefined}>
                    {m.user || 'Anonymous'}{isAdmin ? ' (Admin)' : ''}
                  </b>
                  <span style={{color:'#888', fontSize:12}}>{m.ts ? new Date(m.ts).toLocaleTimeString() : ''}</span>
                </div>
                <div style={{whiteSpace:'pre-wrap', fontWeight: isAdmin ? '700' : '400', color: isAdmin ? '#b91c1c' : 'inherit'}}>
                  {m.text}
                </div>
              </div>
            );
          })}
        </div>
        <form onSubmit={sendMessage} style={{display:'flex', gap:8, padding:12, borderTop:'1px solid #e5e7eb'}}>
          <input
            className="form-control"
            placeholder="Type a message…"
            value={text}
            onChange={e => setText(e.target.value)}
          />
          <button
            className="button-primary"
            type="submit"
            disabled={!!nextSendAt}
            style={nextSendAt ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
          >
            {nextSendAt ? `Wait ${cooldownLeft || 1}s` : 'Send'}
          </button>
        </form>
      </div>

      {lastError && (
        <div style={{marginTop:8, color:'#b91c1c', fontSize:13}}>
          Connection error: {lastError}
        </div>
      )}

      <div style={{marginTop:12, display:'flex', gap:8}}>
        <button className="button-secondary" onClick={() => navigate('/')}>
          ← Back to Home
        </button>
      </div>
    </div>
  );
}
