import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { io } from 'socket.io-client';
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
  const [status, setStatus] = useState('connecting');
  const [lastError, setLastError] = useState('');
  const listRef = useRef(null);

  // Connect to same-origin (http://localhost:3000) and let Vite proxy `/socket.io` to backend
  const socket = useMemo(() => io('/', {
    withCredentials: true,
    transports: ['websocket', 'polling'],
    path: '/socket.io'
  }), []);

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
      socket.close();
    };
  }, [socket]);

  useEffect(() => {
    // auto-scroll to bottom on new messages
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    socket.emit('chat:message', { text: trimmed, user: getUserDisplay() });
    setText('');
  };

  return (
    <div className="container" style={{maxWidth: 900}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,marginBottom:12}}>
        <h1 style={{margin:0}}>Live Chat</h1>
        <div style={{fontSize: 14, color: status === 'connected' ? '#16a34a' : status === 'connecting' ? '#d97706' : '#b91c1c'}}>
          {status === 'connected' ? '● Connected' : status === 'connecting' ? '● Connecting…' : '● Disconnected'}
        </div>
      </div>

      <div className="card" style={{padding:0, border:'1px solid #e5e7eb', borderRadius:8, overflow:'hidden'}}>
        <div ref={listRef} style={{height: '50vh', overflowY: 'auto', padding: 12, background:'#fafafa'}}>
          {messages.length === 0 && (
            <div className="empty-state"><p>No messages yet. Say hi!</p></div>
          )}
          {messages.map(m => (
            <div key={m.id} style={{
              background:'#fff',
              border:'1px solid #e5e7eb',
              borderRadius:6,
              padding:'8px 10px',
              marginBottom:8
            }}>
              <div style={{display:'flex', alignItems:'baseline', gap:8}}>
                <b>{m.user || 'Anonymous'}</b>
                <span style={{color:'#888', fontSize:12}}>{m.ts ? new Date(m.ts).toLocaleTimeString() : ''}</span>
              </div>
              <div style={{whiteSpace:'pre-wrap'}}>{m.text}</div>
            </div>
          ))}
        </div>
        <form onSubmit={sendMessage} style={{display:'flex', gap:8, padding:12, borderTop:'1px solid #e5e7eb'}}>
          <input
            className="form-control"
            placeholder="Type a message…"
            value={text}
            onChange={e => setText(e.target.value)}
          />
          <button className="button-primary" type="submit">Send</button>
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
