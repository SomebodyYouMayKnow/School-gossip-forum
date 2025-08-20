import React, { useState, useEffect } from 'react';
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


    return (
        <div className="posts-container">
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
                        <div className="post-card" key={post._id} onClick={e => {
                            if (e.target.tagName !== 'BUTTON') handlePostClick(post._id);
                        }} style={{ cursor: 'pointer' }}>
                            <h3 className="post-title" style={isAdminPost && !isCurrentUserAdmin ? { color: 'red', fontWeight: 'bold' } : {}}>
                                {post.postTitle}
                                {isAdminPost && !isCurrentUserAdmin && <span style={{marginLeft:6, color:'red', fontWeight:'bold', fontSize:'0.95em'}}>(admin)</span>}
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
                                >▲ Upvote {post.upvotes ? post.upvotes.length : 0}</button>
                                <button
                                    className={`downvote-btn${userVote === 'downvote' ? ' upvoted' : ''}`}
                                    onClick={e => handleVote(e, post._id, userVote === 'downvote' ? 'remove' : 'downvote')}
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