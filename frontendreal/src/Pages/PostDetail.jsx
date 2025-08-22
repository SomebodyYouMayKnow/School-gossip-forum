// Modal for admin delete
function DeletePostModal({ open, onClose, onDelete, reason, setReason, hide, setHide }) {
    if (!open) return null;
    return (
        <div
            style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.3)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}
            onClick={onClose}
        >
            <div
                style={{background:'#fff',padding:24,borderRadius:8,minWidth:320,boxShadow:'0 2px 16px #0003'}}
                onClick={e => e.stopPropagation()}
            >
                <h3>Delete Post</h3>
                <div style={{marginBottom:12}}>
                    <label>Reason for deleting (shown as content):<br/>
                        <textarea value={reason} onChange={e=>setReason(e.target.value)} rows={3} style={{width:'100%',marginTop:4}} />
                    </label>
                </div>
                <div style={{marginBottom:16}}>
                    <label><input type="checkbox" checked={hide} onChange={e=>setHide(e.target.checked)} /> Hide this post from feed (cannot be undone)</label>
                </div>
                <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
                    <button onClick={onClose}>Cancel</button>
                    <button style={{background:'#d11a2a',color:'#fff'}} onClick={()=>onDelete(reason,hide)} disabled={!reason.trim()}>Delete</button>
                </div>
            </div>
        </div>
    );
}
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import './Pages.css';
import { BACKEND_ADDRESS } from '../config/api';

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

const PostDetail = () => {
    // Modal state hooks must be at the top
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteReason, setDeleteReason] = useState('');
    const [deleteHide, setDeleteHide] = useState(false);

    const params = useParams();
    const postId = params.postid;
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

    // Admin check (assume post.admin or userId === post.adminId)
    const isAdmin = post && (post.admin || userId === post.adminId || (userId && post.admins && post.admins.includes(userId)));


    // Delete post handler
    const handleDeletePost = async (reason, hide) => {
        try {
            await axios.patch(`${BACKEND_ADDRESS}/api/post/${postId}/delete`, { reason, hide }, {
                headers: { Authorization: userId }
            });
            setDeleteModalOpen(false);
            window.location.reload();
        } catch (err) {
            alert(err?.response?.data?.message || 'Failed to delete post.');
        }
    };

    return (
        <div className="posts-container">
            {isAdmin && post && deleteModalOpen && (
                <DeletePostModal
                    open={deleteModalOpen}
                    onClose={()=>setDeleteModalOpen(false)}
                    onDelete={handleDeletePost}
                    reason={deleteReason}
                    setReason={setDeleteReason}
                    hide={deleteHide}
                    setHide={setDeleteHide}
                />
            )}
            <div className="post-card">
                <h2 className="post-title">{post.postTitle}</h2>
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
                        onClick={() => handleVote(voteState.userVote === 'upvote' ? 'remove' : 'upvote')}
                    >▲ Upvote {voteState.upvotes}</button>
                    <button
                        className={`upvote-btn${voteState.userVote === 'downvote' ? ' upvoted' : ''}`}
                        onClick={() => handleVote(voteState.userVote === 'downvote' ? 'remove' : 'downvote')}
                    >▼ Downvote {voteState.downvotes}</button>
                    {isAdmin && (
                        <button
                            style={{marginLeft:'auto',background:'#d11a2a',color:'#fff'}}
                            onClick={()=>setDeleteModalOpen(true)}
                        >Delete Post</button>
                    )}
                    {!isAdmin && userId && post.userID === userId && !post.deleted && (
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
                    <div style={{
                        background: '#ffeaea',
                        color: '#b00',
                        border: '1px solid #b00',
                        padding: '12px',
                        borderRadius: '6px',
                        marginBottom: '18px',
                        fontWeight: 'bold',
                        textAlign: 'center'
                    }}>
                        {post.deleted
                            ? 'Comments are disabled because this post has been deleted by an admin.'
                            : 'Comments are disabled for this post.'}
                    </div>
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
            // If post is deleted and hidden, show static deleted message only
            if (post.deleted && post.hidden) {
                return (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '40vh',
                        color: '#888',
                        fontSize: '1.3rem',
                        border: '2px solid #222',
                        borderRadius: 12,
                        margin: '2rem auto',
                        maxWidth: 600,
                        background: '#fafafa',
                        padding: '3rem 2rem'
                    }}>
                        <span role="img" aria-label="deleted" style={{fontSize:'2.5rem',marginBottom:'1rem'}}>🗑️</span>
                        <div>This post was deleted.</div>
                    </div>
                );
            }
                        const liked = comment.likes && userId && comment.likes.includes(userId);
                        const replies = comment.replies || [];
                        const state = replyState[comment._id] || { show: false, text: '', loading: false };
                        // Check if admin (assume comment.admin or comment.userId is admin)
                        const isAdmin = comment.admin || comment.isAdmin;
                        return (
                            <div className="comment" key={comment._id}>
                                <div className="comment-meta">
                                    <b style={isAdmin ? { color: 'red', fontWeight: 'bold' } : {}}>
                                        {comment.fullName || comment.username || 'Anonymous'}
                                        {isAdmin && <span style={{marginLeft:6, color:'red', fontWeight:'bold', fontSize:'0.95em'}}>(admin)</span>}
                                    </b>
                                    <span style={{color:'#888',fontSize:'0.95em',marginLeft:8}}>{comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ''}</span>
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
                                                action: liked ? 'unlike' : 'like'
                                            });
                                            setComments(comments => comments.map(c =>
                                                c._id === comment._id
                                                    ? { ...c, likes: liked ? c.likes.filter(id => id !== userId) : [...(c.likes||[]), userId] }
                                                    : c
                                            ));
                                        } catch {
                                            alert('Failed to like comment.');
                                        }
                                    }}
                                >👍 {comment.likes ? comment.likes.length : 0}</button>
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
                                >Reply</button>
                                {state.show && (
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
                                                    <div className="comment-meta">
                                                        <b style={isAdminReply ? { color: 'red', fontWeight: 'bold' } : {}}>
                                                            {reply.fullName || reply.username || 'Anonymous'}
                                                            {isAdminReply && <span style={{marginLeft:6, color:'red', fontWeight:'bold', fontSize:'0.95em'}}>(admin)</span>}
                                                        </b>
                                                        <span style={{color:'#888',fontSize:'0.95em',marginLeft:8}}>{reply.createdAt ? new Date(reply.createdAt).toLocaleString() : ''}</span>
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
