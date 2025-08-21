import React, { useState, useEffect } from 'react';
// Simple modal for delete post
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
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import './Pages.css';




const ViewPosts = () => {

    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const POSTS_PER_PAGE = 10;
    const [total, setTotal] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ open: false, postId: null });
    const [deleteReason, setDeleteReason] = useState('');
    const [deleteHide, setDeleteHide] = useState(false);

    // Sorting and filtering state
    const [sortBy, setSortBy] = useState('recent');
    const [order, setOrder] = useState('desc');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');


    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            try {
                let params = `limit=${POSTS_PER_PAGE}&skip=${(page-1)*POSTS_PER_PAGE}`;
                params += `&sortBy=${sortBy}`;
                params += `&order=${order}`;
                if (dateFrom) params += `&dateFrom=${dateFrom}`;
                if (dateTo) params += `&dateTo=${dateTo}`;
                const response = await axios.get(`http://localhost:5555/api/recent-posts?${params}`);
                const newPosts = response.data.posts || [];
                // commentCount is now provided by backend as commentsCount
                const postsWithComments = newPosts.map(post => ({ ...post, commentCount: post.commentsCount ?? 0 }));
                setPosts(prev => page === 1 ? postsWithComments : [...prev, ...postsWithComments]);
                setTotal(response.data.total);
                setHasMore(((page - 1) * POSTS_PER_PAGE + newPosts.length) < response.data.total);
            } catch (err) {
                setError('Failed to load posts');
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
        // eslint-disable-next-line
    }, [page, sortBy, order, dateFrom, dateTo]);

    useEffect(() => {
        const handleScroll = () => {
            if (loading || !hasMore) return;
            if (window.innerHeight + document.documentElement.scrollTop + 100 >= document.documentElement.offsetHeight) {
                setPage(prev => prev + 1);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [loading, hasMore]);


    const navigate = useNavigate();

    // Helper to strip HTML tags for preview
    const stripHtml = (html) => {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    };

    const handlePostClick = (id) => {
        navigate(`/posts?postid=${id}`);
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


    const handleVote = async (e, postId, action) => {
        e.stopPropagation();
        if (!userId) {
            alert('You must be logged in to vote.');
            return;
        }
        try {
            const response = await axios.post('http://localhost:5555/api/vote', { postId, userId, action });
            setPosts(prevPosts => prevPosts.map(post =>
                post._id === postId
                    ? {
                        ...post,
                        upvotes: Array(response.data.upvotes).fill('x'), // just for count
                        downvotes: Array(response.data.downvotes).fill('x'),
                        userVote: response.data.userVote
                    }
                    : post
            ));
        } catch (err) {
            alert('Failed to vote.');
        }
    };

    const getUserVote = (post) => {
        if (!userId || !post) return null;
        if (post.userVote) return post.userVote;
        if (post.upvotes && post.upvotes.includes(userId)) return 'upvote';
        if (post.downvotes && post.downvotes.includes(userId)) return 'downvote';
        return null;
    };


    // Debug: show current user info
    let debugUser = { userId: null, admin: null };
    try {
        const userCookie = Cookies.get('user');
        if (userCookie) {
            const userData = JSON.parse(userCookie);
            debugUser.userId = userData.userId || userData._id;
            debugUser.admin = userData.admin;
        }
    } catch {}

    return (
        <div className="posts-container">
            <div style={{background:'#ffeeba',color:'#856404',padding:'8px',marginBottom:'10px',borderRadius:'4px',fontSize:'0.95em'}}>
                <b>Debug:</b> userId: {String(debugUser.userId)} | admin: {String(debugUser.admin)}
            </div>
            <h2>Posts</h2>
            {/* Sorting and filtering controls */}
            <div style={{display:'flex',gap:'16px',marginBottom:'18px',flexWrap:'wrap',alignItems:'center'}}>
                <label>Sort by:
                    <select value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1); }} style={{marginLeft:8}}>
                        <option value="recent">Most Recent</option>
                        <option value="old">Oldest</option>
                        <option value="upvotes">Most Upvotes</option>
                        <option value="downvotes">Most Downvotes</option>
                        <option value="comments">Most Comments</option>
                    </select>
                </label>
                <label>Order:
                    <select value={order} onChange={e => { setOrder(e.target.value); setPage(1); }} style={{marginLeft:8}}>
                        <option value="desc">Descending</option>
                        <option value="asc">Ascending</option>
                    </select>
                </label>
                <label>From:
                    <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} style={{marginLeft:8}} />
                </label>
                <label>To:
                    <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} style={{marginLeft:8}} />
                </label>
                <button onClick={() => { setSortBy('recent'); setOrder('desc'); setDateFrom(''); setDateTo(''); setPage(1); }} style={{marginLeft:8}}>Reset</button>
            </div>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {posts.length === 0 && !loading && !error && <p>No posts found.</p>}
            <div className="posts-list">
                {posts.map(post => {
                    const userVote = getUserVote(post);
                    // Highlight admin posts for regular users
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
                        <div
                            className="post-card"
                            key={post._id}
                            onClick={e => {
                                if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'svg' && e.target.tagName !== 'path') handlePostClick(post._id);
                            }}
                            style={{
                                cursor: 'pointer',
                                position: 'relative',
                                ...(post.deleted ? { outline: '3px solid black' } : {})
                            }}
                        >
                            <h3
                                className="post-title"
                                style={
                                    post.deleted
                                        ? { color: 'black', fontWeight: 'bold', background: '#f8f8f8', borderRadius: '4px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '8px' }
                                        : post.commentsDisabled
                                            ? { color: '#b88600', fontWeight: 'bold', background: '#fffbe6', borderRadius: '4px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '8px' }
                                            : (isAdminPost && !isCurrentUserAdmin ? { color: 'red', fontWeight: 'bold' } : {})
                                }
                            >
                                {post.deleted && <span style={{color:'#b00',fontWeight:'bold',fontSize:'1.1em',marginRight:4}} title="Deleted post">⚠️</span>}
                                {post.commentsDisabled && !post.deleted && <span style={{color:'#b88600',fontWeight:'bold',fontSize:'1.1em',marginRight:4}} title="Paused post">⏸️</span>}
                                {post.postTitle}
                                {post.deleted && <span style={{marginLeft:8, color:'#b00', fontWeight:'bold', fontSize:'0.97em'}}>Deleted by admin</span>}
                                {post.commentsDisabled && !post.deleted && <span style={{marginLeft:8, color:'#b88600', fontWeight:'bold', fontSize:'0.97em'}}>Interaction paused</span>}
                                {isAdminPost && !isCurrentUserAdmin && <span style={{marginLeft:6, color:'red', fontWeight:'bold', fontSize:'0.95em'}}>(admin)</span>}
                                {/* Admin delete icon */}
                                {isCurrentUserAdmin && !post.deleted && (
                                    <>
                                        <span
                                            title="Delete post for everyone"
                                            style={{ float: 'right', cursor: 'pointer', color: '#d11a2a', marginLeft: 12 }}
                                            onClick={e => {
                                                e.stopPropagation();
                                                setDeleteModal({ open: true, postId: post._id });
                                                setDeleteReason('');
                                                setDeleteHide(false);
                                            }}
                                        >
                                            {/* Trash SVG icon */}
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                                        </span>
            {/* Delete Post Modal */}
            <DeletePostModal
                open={deleteModal.open}
                reason={deleteReason}
                setReason={setDeleteReason}
                hide={deleteHide}
                setHide={setDeleteHide}
                onClose={() => setDeleteModal({ open: false, postId: null })}
                onDelete={async (reason, hide) => {
                    const postId = deleteModal.postId;
                    setDeleteModal({ open: false, postId: null });
                    try {
                        const userCookie = Cookies.get('user');
                        const userData = userCookie ? JSON.parse(userCookie) : {};
                        const adminId = userData.userId || userData._id;
                        await axios.patch(`http://localhost:5555/api/post/${postId}/delete`, { reason, adminId, hide });
                        setPosts(prevPosts => prevPosts.map(p =>
                            p._id === postId
                                ? { ...p, postTitle: 'Deleted', postContent: reason, deleted: true, commentsDisabled: true, hidden: !!hide }
                                : p
                        ));
                    } catch (err) {
                        alert('Failed to delete post.');
                    }
                }}
            />
                                        <button
                                            style={{ float: 'right', marginLeft: 8, background: post.commentsDisabled ? '#ffc107' : '#4caf50', color: '#222', border: 'none', borderRadius: 4, padding: '2px 10px', cursor: 'pointer' }}
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                try {
                                                    const userCookie = Cookies.get('user');
                                                    const userData = userCookie ? JSON.parse(userCookie) : {};
                                                    const adminId = userData.userId || userData._id;
                                                    await axios.patch(`http://localhost:5555/api/post/${post._id}/pause`, { adminId, pause: !post.commentsDisabled });
                                                    setPosts(prevPosts => prevPosts.map(p =>
                                                        p._id === post._id
                                                            ? { ...p, commentsDisabled: !post.commentsDisabled }
                                                            : p
                                                    ));
                                                } catch (err) {
                                                    alert('Failed to toggle post interaction.');
                                                }
                                            }}
                                        >
                                            {post.commentsDisabled ? 'Resume Interaction' : 'Pause Interaction'}
                                        </button>
                                    </>
                                )}
                            </h3>
                            <div className="post-meta">By {post.fullName} on {post.creationDate ? new Date(post.creationDate).toLocaleString() : ''}</div>
                            <div className="post-content post-preview">{stripHtml(post.postContent).slice(0, 180)}{stripHtml(post.postContent).length > 180 ? '...' : ''}</div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'center', cursor: 'default' }}>
                                <span className="comment-count" style={{marginRight:'8px',color:'#4f8cff',fontWeight:500}}>
                                    💬 {post.commentCount}
                                </span>
                                <button
                                    className={`upvote-btn${userVote === 'upvote' ? ' upvoted' : ''}`}
                                    onClick={e => handleVote(e, post._id, userVote === 'upvote' ? 'remove' : 'upvote')}
                                    disabled={post.deleted || post.commentsDisabled}
                                >▲ Upvote {post.upvotes ? post.upvotes.length : 0}</button>
                                <button
                                    className={`downvote-btn${userVote === 'downvote' ? ' upvoted' : ''}`}
                                    onClick={e => handleVote(e, post._id, userVote === 'downvote' ? 'remove' : 'downvote')}
                                    disabled={post.deleted || post.commentsDisabled}
                                >▼ Downvote {post.downvotes ? post.downvotes.length : 0}</button>
                            </div>
                            <div className="post-toggle-tip">Click to view full post</div>
                        </div>
                    );
                })}
            </div>
            {loading && <p>Loading...</p>}
            {!hasMore && posts.length > 0 && <p style={{textAlign:'center',color:'#888',marginTop:'20px'}}>No more posts.</p>}
        </div>
    );
}

export default ViewPosts