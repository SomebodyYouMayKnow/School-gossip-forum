import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import './Pages.css';

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

const PostDetail = () => {
    const query = useQuery();
    const postId = query.get('postid');
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
                const response = await axios.get(`http://localhost:5555/api/post/${postId}`);
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
                const response = await axios.get(`http://localhost:5555/api/comment/${postId}`);
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
            const response = await axios.post('http://localhost:5555/api/comment', {
                postId,
                userId,
                fullName,
                text: commentText.trim()
            });
            setComments(prev => [...prev, response.data.comment]);
            setCommentText('');
        } catch {
            alert('Failed to add comment.');
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
            const response = await axios.post('http://localhost:5555/api/vote', { postId, userId, action });
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

    return (
        <div className="posts-container">
            <div className="post-card">
                <h2 className="post-title">{post.postTitle}</h2>
                <div className="post-meta">By {post.fullName} on {post.creationDate ? new Date(post.creationDate).toLocaleString() : ''}</div>
                <div className="post-content" dangerouslySetInnerHTML={{ __html: post.postContent }} />
                <div style={{ display: 'flex', gap: '12px', marginTop: '18px', alignItems: 'center' }}>
                    <button
                        className={`upvote-btn${voteState.userVote === 'upvote' ? ' upvoted' : ''}`}
                        onClick={() => handleVote(voteState.userVote === 'upvote' ? 'remove' : 'upvote')}
                    >▲ Upvote {voteState.upvotes}</button>
                    <button
                        className={`upvote-btn${voteState.userVote === 'downvote' ? ' upvoted' : ''}`}
                        onClick={() => handleVote(voteState.userVote === 'downvote' ? 'remove' : 'downvote')}
                    >▼ Downvote {voteState.downvotes}</button>
                </div>
            </div>
            <div className="comments-section">
                <h3>Comments ({comments.length})</h3>
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
                <div className="comments-list">
                    {comments.length === 0 && <div style={{color:'#888'}}>No comments yet.</div>}
                    {comments.map(comment => {
                        const liked = comment.likes && userId && comment.likes.includes(userId);
                        const replies = comment.replies || [];
                        const state = replyState[comment._id] || { show: false, text: '', loading: false };
                        return (
                            <div className="comment" key={comment._id}>
                                <div className="comment-meta">
                                    <b>{comment.fullName || comment.username || 'Anonymous'}</b>
                                    <span style={{color:'#888',fontSize:'0.95em',marginLeft:8}}>{comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ''}</span>
                                </div>
                                <div className="comment-text">{comment.text}</div>
                                <button
                                    className={`upvote-btn${liked ? ' upvoted' : ''}`}
                                    style={{marginTop:6,marginRight:8,padding:'2px 10px',fontSize:'0.95em'}}
                                    onClick={async () => {
                                        if (!userId) { alert('You must be logged in to like comments.'); return; }
                                        try {
                                            await axios.post('http://localhost:5555/api/comment/like', {
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
                                                const response = await axios.post('http://localhost:5555/api/comment/reply', {
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
                                            } catch {
                                                alert('Failed to reply.');
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
                                        {replies.map(reply => (
                                            <div className="comment" key={reply._id} style={{background:'#f5f7fa'}}>
                                                <div className="comment-meta">
                                                    <b>{reply.fullName || reply.username || 'Anonymous'}</b>
                                                    <span style={{color:'#888',fontSize:'0.95em',marginLeft:8}}>{reply.createdAt ? new Date(reply.createdAt).toLocaleString() : ''}</span>
                                                </div>
                                                <div className="comment-text">{reply.text}</div>
                                            </div>
                                        ))}
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
