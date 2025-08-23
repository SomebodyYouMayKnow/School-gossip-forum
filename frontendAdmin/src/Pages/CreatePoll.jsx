import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Pages.css';
import axios from 'axios';
import Cookies from 'js-cookie';
import { BACKEND_ADDRESS } from '../config/api';

export default function CreatePoll() {
  const navigate = useNavigate();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [active, setActive] = useState(true);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const addOption = () => setOptions(o => [...o, '']);
  const removeOption = (idx) => setOptions(o => o.length > 2 ? o.filter((_, i) => i !== idx) : o);
  const updateOption = (idx, val) => setOptions(o => o.map((v, i) => i === idx ? val : v));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (submitting) return;

    const trimmed = options.map(o => o.trim()).filter(Boolean);
    if (!question.trim()) {
      setError('Question is required.');
      return;
    }
    if (trimmed.length < 2) {
      setError('Please provide at least two non-empty options.');
      return;
    }

    try {
      setSubmitting(true);
      const userCookie = Cookies.get('user');
      const token = userCookie ? JSON.parse(userCookie).token : null;
      if (!token) {
        setError('You must be logged in as admin.');
        setSubmitting(false);
        return;
      }
      // Build multipart form
      const form = new FormData();
      form.append('question', question.trim());
      form.append('options', JSON.stringify(trimmed));
      form.append('active', String(!!active));
      form.append('description', description);
      if (images && images.length) {
        for (const f of images) {
          form.append('images', f);
        }
      }
      const resp = await axios.post(`${BACKEND_ADDRESS}/api/polls`, form, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (resp.data && resp.data.success) {
        navigate('/polls');
      } else {
        setError(resp.data?.message || 'Failed to create poll');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create poll');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="create-poll-container container">
      <h1 className="create-post-title">Create Poll</h1>
      <form onSubmit={handleSubmit} className="create-post-form">
        <div className="form-group">
          <label className="form-label">Question</label>
          <input
            className="form-input"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="e.g. What should we add next?"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Options</label>
          <div className="options-list">
            {options.map((opt, idx) => (
              <div className="option-edit-row" key={idx}>
                <input
                  className="form-input"
                  value={opt}
                  onChange={e => updateOption(idx, e.target.value)}
                  placeholder={`Option ${idx + 1}`}
                />
                <button type="button" className="btn-outline" onClick={() => removeOption(idx)} disabled={options.length <= 2}>
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button type="button" className="button-primary" onClick={addOption}>Add Option</button>
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            className="form-input"
            rows={5}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe the poll in more detail"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Images (up to 5)</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={e => setImages(Array.from(e.target.files || []))}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="checkbox-row">
            <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} />
            <span>Active immediately</span>
          </label>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" className="submit-btn" disabled={submitting}>{submitting ? 'Creating...' : 'Create Poll'}</button>
      </form>
    </div>
  );
}
