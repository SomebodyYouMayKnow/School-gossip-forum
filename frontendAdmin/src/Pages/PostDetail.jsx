import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import './Pages.css';
import { BACKEND_ADDRESS } from '../config/api';

const PostDetail = () => {
    const postId = (typeof window !== 'undefined') ? new URLSearchParams(window.location.search).get('postid') : null;
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [voteState, setVoteState] = useState({ upvotes: 0, downvotes: 0, userVote: null });
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState('');
    const [commentLoading, setCommentLoading] = useState(false);
    // For reply UI state: { [commentId]: { show: bool, text: string, loading: bool } }
    const [replyState, setReplyState] = useState({});

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const response = await axios.get(`${BACKEND_ADDRESS}/api/post/${postId}`);
                setPost(response.data.post);
                setVoteState({
                    upvotes: response.data.post.upvotes ? response.data.post.upvotes.length : 0,
                    downvotes: response.data.post.downvotes ? response.data.post.downvotes.length : 0,
                    userVote: getUserVote(response.data.post)
                });
            } catch (err) {
                setError('Failed to load post');
            } finally {
                setLoading(false);
            }
        };
        const fetchComments = async () => {
            try {
                const response = await axios.get(`${BACKEND_ADDRESS}/api/comment/${postId}`);
                setComments(response.data.comments || []);
            } catch {}
        };
        if (postId) {
            fetchPost();
            fetchComments();
        }
        // eslint-disable-next-line
    }, [postId]);
    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!userId) {
            alert('You must be logged in to comment.');
            return;
        }
        if (!commentText.trim()) return;
        setCommentLoading(true);
        try {
            const userCookie = Cookies.get('user');
            const userData = userCookie ? JSON.parse(userCookie) : {};
            const fullName = userData.fullName || 'Anonymous';
            const response = await axios.post(`${BACKEND_ADDRESS}/api/comment`, {
                postId,
                userId,
                fullName,
                text: commentText.trim()
            });
            if (response.data && response.data.success) {
                setComments(prev => [...prev, response.data.comment]);
                setCommentText('');
            }
        } catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
                alert(err.response.data.message);
            } else {
                alert('Failed to add comment.');
            }
        } finally {
            setCommentLoading(false);
        }
    };

    // Get user ID from cookie (assumes user cookie contains userId)
    let userId = null;
    try {
        const userCookie = Cookies.get('user');
        if (userCookie) {
            const userData = JSON.parse(userCookie);
            userId = userData.userId || userData._id;
        }
    } catch {}

    function getUserVote(postObj) {
        if (!userId || !postObj) return null;
        if (postObj.upvotes && postObj.upvotes.includes(userId)) return 'upvote';
        if (postObj.downvotes && postObj.downvotes.includes(userId)) return 'downvote';
        return null;
    }

    const handleVote = async (action) => {
        if (!userId) {
            alert('You must be logged in to vote.');
            return;
        }
        try {
            const response = await axios.post(`${BACKEND_ADDRESS}/api/vote`, { postId, userId, action });
            setVoteState({
                upvotes: response.data.upvotes,
                downvotes: response.data.downvotes,
                userVote: response.data.userVote
            });
        } catch (err) {
            alert('Failed to vote.');
        }
    };

    if (loading) return <div className="posts-container"><p>Loading...</p></div>;
    if (error) return <div className="posts-container"><p style={{ color: 'red' }}>{error}</p></div>;
    if (!post) return <div className="posts-container"><p>Post not found.</p></div>;

    // Highlight admin post for regular users
    const isAdminPost = post.admin === true || post.admin === 'true';
    let isCurrentUserAdmin = false;
    try {
        const userCookie = Cookies.get('user');
        if (userCookie) {
            const userData = JSON.parse(userCookie);
            isCurrentUserAdmin = userData.admin === true || userData.admin === 'true';
        }
    } catch {}
    return (
        <div className="posts-container">
            <div className="post-card" style={post.deleted ? { outline: '3px solid black' } : {}}>
                <h2 className="post-title" style={isAdminPost && !isCurrentUserAdmin ? { color: 'red', fontWeight: 'bold' } : {}}>
                    {post.postTitle}
                    {isAdminPost && !isCurrentUserAdmin && <span style={{marginLeft:6, color:'red', fontWeight:'bold', fontSize:'0.95em'}}>(admin)</span>}
                    {/* Admin delete and pause/resume icons */}
                    {isCurrentUserAdmin && !post.deleted && (
                        <>
                            <span
                                title="Delete post for everyone"
                                style={{ float: 'right', cursor: 'pointer', color: '#d11a2a', marginLeft: 12 }}
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    const reason = window.prompt('Enter reason for deleting this post (will be shown as content):');
                                    if (!reason) return;
                                    try {
                                        const userCookie = Cookies.get('user');
                                        const userData = userCookie ? JSON.parse(userCookie) : {};
                                        const adminId = userData.userId || userData._id;
                                        await axios.patch(`${BACKEND_ADDRESS}/api/post/${post._id}/delete`, { reason, adminId });
                                        setPost(prev => prev ? { ...prev, postTitle: 'Deleted', postContent: reason, deleted: true, commentsDisabled: true } : prev);
                                    } catch (err) {
                                        alert('Failed to delete post.');
                                    }
                                }}
                            >
                                {/* Trash SVG icon */}
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                            </span>
                            <button
                                style={{ float: 'right', marginLeft: 8, background: post.commentsDisabled ? '#ffc107' : '#4caf50', color: '#222', border: 'none', borderRadius: 4, padding: '2px 10px', cursor: 'pointer' }}
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                        const userCookie = Cookies.get('user');
                                        const userData = userCookie ? JSON.parse(userCookie) : {};
                                        const adminId = userData.userId || userData._id;
                                        await axios.patch(`${BACKEND_ADDRESS}/api/post/${post._id}/pause`, { adminId, pause: !post.commentsDisabled });
                                        setPost(prev => prev ? { ...prev, commentsDisabled: !prev.commentsDisabled } : prev);
                                    } catch (err) {
                                        alert('Failed to toggle post interaction.');
                                    }
                                }}
                            >
                                {post.commentsDisabled ? 'Resume Interaction' : 'Pause Interaction'}
                            </button>
                        </>
                    )}
                </h2>
                <div className="post-meta">By {post.fullName} on {post.creationDate ? new Date(post.creationDate).toLocaleString() : ''}</div>
                {post.category && (
                    <div style={{
                        marginBottom: '12px',
                        fontSize: '0.9em',
                        color: '#666'
                    }}>
                        <span style={{
                            background: '#e9ecef',
                            color: '#495057',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontWeight: '500'
                        }}>
                            📂 Category: {post.category}
                        </span>
                    </div>
                )}
                <div className="post-content" dangerouslySetInnerHTML={{ __html: post.postContent }} />
                {/* Display images if any */}
                {post.images && post.images.length > 0 && (
                    <div className="post-images" style={{ marginTop: '20px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                            {post.images.map((imagePath, index) => (
                                <img
                                    key={index}
                                    src={`${BACKEND_ADDRESS}/uploads/${imagePath}`}
                                    alt={`Post image ${index + 1}`}
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
                                        // Open image in new tab for full view
                                        window.open(`${BACKEND_ADDRESS}/uploads/${imagePath}`, '_blank');
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}
                <div style={{ display: 'flex', gap: '12px', marginTop: '18px', alignItems: 'center' }}>
                    <button
                        className={`upvote-btn${voteState.userVote === 'upvote' ? ' upvoted' : ''}`}
                        onClick={() => handleVote('upvote')}
                        disabled={post.deleted}
                    >▲ Upvote {voteState.upvotes}</button>
                    <button
                        className={`downvote-btn${voteState.userVote === 'downvote' ? ' upvoted' : ''}`}
                        onClick={() => handleVote('downvote')}
                        disabled={post.deleted}
                    >▼ Downvote {voteState.downvotes}</button>
                    {voteState.userVote && (
                        <button
                            className="upvote-btn"
                            style={{ background: '#6c757d', color: '#fff' }}
                            onClick={() => handleVote('remove')}
                            title="Remove all my votes on this post"
                        >Reset my votes</button>
                    )}
                    {!isCurrentUserAdmin && userId && post.userID === userId && !post.deleted && (
                        <button
                            style={{
                                marginLeft: 'auto',
                                background: '#d11a2a',
                                color: '#fff',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                            onClick={async () => {
                                if (confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
                                    try {
                                        await axios.delete(`${BACKEND_ADDRESS}/api/post/${postId}`, {
                                            data: { userId }
                                        });
                                        alert('Post deleted successfully');
                                        window.location.href = '/';
                                    } catch (err) {
                                        const errorMessage = err.response?.data?.message || 'Failed to delete post';
                                        alert(errorMessage);
                                    }
                                }
                            }}
                        >
                            🗑️ Delete My Post
                        </button>
                    )}
                </div>
            </div>
            <div className="comments-section">
                <h3>Comments ({comments.length})</h3>
                {(post.deleted || post.commentsDisabled) ? (
                    <div style={{color:'#888',marginBottom:'18px'}}>Comments are disabled for this post.</div>
                ) : (
                    <form className="comment-form" onSubmit={handleCommentSubmit} style={{marginBottom: '18px'}}>
                        <textarea
                            className="comment-input"
                            value={commentText}
                            onChange={e => setCommentText(e.target.value)}
                            placeholder="Write a comment..."
                            rows={3}
                            disabled={commentLoading}
                            style={{width:'100%',resize:'vertical',marginBottom:'8px'}}
                        />
                        <button className="upvote-btn" type="submit" disabled={commentLoading || !commentText.trim()}>
                            {commentLoading ? 'Posting...' : 'Post Comment'}
                        </button>
                    </form>
                )}
                <div className="comments-list">
                    {comments.length === 0 && <div style={{color:'#888'}}>No comments yet.</div>}
                    {comments.map(comment => {
                        const liked = comment.likes && userId && comment.likes.includes(userId);
                        const replies = comment.replies || [];
                        const state = replyState[comment._id] || { show: false, text: '', loading: false };
                        // Check if admin (assume comment.admin or comment.userId is admin)
                        const isAdmin = comment.admin || comment.isAdmin;
                        return (
                            <div className="comment" key={comment._id}>
                                <div className="comment-meta" style={{ display: 'flex', alignItems: 'center' }}>
                                    <b style={isAdmin ? { color: 'red', fontWeight: 'bold' } : {}}>
                                        {comment.fullName || comment.username || 'Anonymous'}
                                        {isAdmin && <span style={{marginLeft:6, color:'red', fontWeight:'bold', fontSize:'0.95em'}}>(admin)</span>}
                                    </b>
                                    <span style={{color:'#888',fontSize:'0.95em',marginLeft:8}}>{comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ''}</span>
                                    {isCurrentUserAdmin && (
                                        <span
                                            title="Delete comment"
                                            style={{marginLeft:12, color:'#d11a2a', cursor:'pointer'}}
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                if (!window.confirm('Are you sure you want to delete this comment?')) return;
                                                try {
                                                    const userCookie = Cookies.get('user');
                                                    const userData = userCookie ? JSON.parse(userCookie) : {};
                                                    const adminId = userData.userId || userData._id;
                                                    await axios.delete(`${BACKEND_ADDRESS}/api/comment`, {
                                                        data: { postId, commentId: comment._id, adminId }
                                                    });
                                                    setComments(comments => comments.filter(c => c._id !== comment._id));
                                                } catch (err) {
                                                    alert('Failed to delete comment.');
                                                }
                                            }}
                                        >
                                            {/* Trash SVG icon */}
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                                        </span>
                                    )}
                                </div>
                                <div className="comment-text">{comment.text}</div>
                                <button
                                    className={`upvote-btn${liked ? ' upvoted' : ''}`}
                                    style={{marginTop:6,marginRight:8,padding:'2px 10px',fontSize:'0.95em'}}
                                    onClick={async () => {
                                        if (!userId) { alert('You must be logged in to like comments.'); return; }
                                        try {
                                            await axios.post(`${BACKEND_ADDRESS}/api/comment/like`, {
                                                postId,
                                                commentId: comment._id,
                                                userId,
                                                action: 'like'
                                            });
                                            setComments(comments => comments.map(c =>
                                                c._id === comment._id
                                                    ? { ...c, likes: [...(c.likes||[]), userId] }
                                                    : c
                                            ));
                                        } catch {
                                            alert('Failed to like comment.');
                                        }
                                    }}
                                >👍 {comment.likes ? comment.likes.length : 0}</button>
                                {liked && (
                                    <button
                                        className="upvote-btn"
                                        style={{marginTop:6,marginRight:8,padding:'2px 10px',fontSize:'0.95em', background:'#6c757d', color:'#fff'}}
                                        onClick={async () => {
                                            if (!userId) { alert('You must be logged in to unlike.'); return; }
                                            try {
                                                await axios.post(`${BACKEND_ADDRESS}/api/comment/like`, {
                                                    postId,
                                                    commentId: comment._id,
                                                    userId,
                                                    action: 'unlike'
                                                });
                                                setComments(comments => comments.map(c =>
                                                    c._id === comment._id
                                                        ? { ...c, likes: (c.likes||[]).filter(id => id !== userId) }
                                                        : c
                                                ));
                                            } catch {
                                                alert('Failed to unlike comment.');
                                            }
                                        }}
                                    >Unlike all</button>
                                )}
                                {userId && comment.userId === userId && (
                                    <button
                                        style={{
                                            marginTop: 6,
                                            marginRight: 8,
                                            padding: '2px 10px',
                                            fontSize: '0.95em',
                                            background: '#d11a2a',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer'
                                        }}
                                        onClick={async () => {
                                            if (!confirm('Are you sure you want to delete this comment?')) return;
                                            try {
                                                await axios.delete(`${BACKEND_ADDRESS}/api/comment/user`, {
                                                    data: { postId, commentId: comment._id, userId }
                                                });
                                                // Remove the comment from local state
                                                setComments(comments => comments.filter(c => c._id !== comment._id));
                                                alert('Comment deleted successfully');
                                            } catch (err) {
                                                const errorMessage = err.response?.data?.message || 'Failed to delete comment';
                                                alert(errorMessage);
                                            }
                                        }}
                                    >
                                        🗑️ Delete
                                    </button>
                                )}
                                <button
                                    className="upvote-btn"
                                    style={{marginTop:6,marginRight:8,padding:'2px 10px',fontSize:'0.95em'}}
                                    onClick={() => setReplyState(s => ({ ...s, [comment._id]: { ...state, show: !state.show } }))}
                                    disabled={post.deleted || post.commentsDisabled}
                                >Reply</button>
                                {state.show && !post.deleted && !post.commentsDisabled && (
                                    <form
                                        onSubmit={async e => {
                                            e.preventDefault();
                                            if (!userId) { alert('You must be logged in to reply.'); return; }
                                            if (!state.text.trim()) return;
                                            setReplyState(s => ({ ...s, [comment._id]: { ...state, loading: true } }));
                                            try {
                                                const userCookie = Cookies.get('user');
                                                const userData = userCookie ? JSON.parse(userCookie) : {};
                                                const fullName = userData.fullName || 'Anonymous';
                                                const response = await axios.post(`${BACKEND_ADDRESS}/api/comment/reply`, {
                                                    postId,
                                                    parentCommentId: comment._id,
                                                    userId,
                                                    fullName,
                                                    text: state.text.trim()
                                                });
                                                setComments(comments => comments.map(c =>
                                                    c._id === comment._id
                                                        ? { ...c, replies: [...(c.replies||[]), response.data.reply] }
                                                        : c
                                                ));
                                                setReplyState(s => ({ ...s, [comment._id]: { show: false, text: '', loading: false } }));
                                            } catch (err) {
                                                if (err.response && err.response.data && err.response.data.message) {
                                                    alert(err.response.data.message);
                                                } else {
                                                    alert('Failed to reply.');
                                                }
                                                setReplyState(s => ({ ...s, [comment._id]: { ...state, loading: false } }));
                                            }
                                        }}
                                        style={{marginTop:8,marginBottom:8}}
                                    >
                                        <textarea
                                            className="comment-input"
                                            value={state.text}
                                            onChange={e => setReplyState(s => ({ ...s, [comment._id]: { ...state, text: e.target.value } }))}
                                            placeholder="Write a reply..."
                                            rows={2}
                                            disabled={state.loading}
                                            style={{width:'100%',resize:'vertical',marginBottom:'4px'}}
                                        />
                                        <button className="upvote-btn" type="submit" disabled={state.loading || !state.text.trim()}>
                                            {state.loading ? 'Replying...' : 'Reply'}
                                        </button>
                                    </form>
                                )}
                                {replies.length > 0 && (
                                    <div style={{marginLeft:24,marginTop:8}}>
                                        {replies.map(reply => {
                                            const isAdminReply = reply.admin || reply.isAdmin;
                                            return (
                                                <div className="comment" key={reply._id} style={{background:'#f5f7fa'}}>
                                                    <div className="comment-meta" style={{ display: 'flex', alignItems: 'center' }}>
                                                        <b style={isAdminReply ? { color: 'red', fontWeight: 'bold' } : {}}>
                                                            {reply.fullName || reply.username || 'Anonymous'}
                                                            {isAdminReply && <span style={{marginLeft:6, color:'red', fontWeight:'bold', fontSize:'0.95em'}}>(admin)</span>}
                                                        </b>
                                                        <span style={{color:'#888',fontSize:'0.95em',marginLeft:8}}>{reply.createdAt ? new Date(reply.createdAt).toLocaleString() : ''}</span>
                                                        {isCurrentUserAdmin && (
                                                            <span
                                                                title="Delete reply"
                                                                style={{marginLeft:12, color:'#d11a2a', cursor:'pointer'}}
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    if (!window.confirm('Are you sure you want to delete this reply?')) return;
                                                                    try {
                                                                        const userCookie = Cookies.get('user');
                                                                        const userData = userCookie ? JSON.parse(userCookie) : {};
                                                                        const adminId = userData.userId || userData._id;
                                                                        await axios.delete(`${BACKEND_ADDRESS}/api/comment`, {
                                                                            data: { postId, commentId: reply._id, adminId }
                                                                        });
                                                                        setComments(comments => comments.map(c =>
                                                                            c._id === comment._id
                                                                                ? { ...c, replies: c.replies.filter(r => r._id !== reply._id) }
                                                                                : c
                                                                        ));
                                                                    } catch (err) {
                                                                        alert('Failed to delete reply.');
                                                                    }
                                                                }}
                                                            >
                                                                {/* Trash SVG icon */}
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="comment-text">{reply.text}</div>
                                                    {userId && reply.userId === userId && (
                                                        <button
                                                            style={{
                                                                marginTop: 6,
                                                                marginRight: 8,
                                                                padding: '2px 10px',
                                                                fontSize: '0.95em',
                                                                background: '#d11a2a',
                                                                color: '#fff',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer'
                                                            }}
                                                            onClick={async () => {
                                                                if (!confirm('Are you sure you want to delete this reply?')) return;
                                                                try {
                                                                    await axios.delete(`${BACKEND_ADDRESS}/api/comment/user`, {
                                                                        data: { postId, commentId: reply._id, userId }
                                                                    });
                                                                    // Remove the reply from local state
                                                                    setComments(comments => comments.map(c =>
                                                                        c._id === comment._id
                                                                            ? { ...c, replies: c.replies.filter(r => r._id !== reply._id) }
                                                                            : c
                                                                    ));
                                                                    alert('Reply deleted successfully');
                                                                } catch (err) {
                                                                    const errorMessage = err.response?.data?.message || 'Failed to delete reply';
                                                                    alert(errorMessage);
                                                                }
                                                            }}
                                                        >
                                                            🗑️ Delete
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default PostDetail;
