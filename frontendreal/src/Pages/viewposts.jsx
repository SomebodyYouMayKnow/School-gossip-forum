import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import './Pages.css';

// Delete confirmation modal
function DeleteConfirmModal({ isOpen, onClose, onConfirm, postTitle }) {
    if (!isOpen) return null;
    
    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(0,0,0,0.5)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: '#fff',
                    padding: '24px',
                    borderRadius: '8px',
                    minWidth: '400px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                }}
                onClick={e => e.stopPropagation()}
            >
                <h3 style={{ margin: '0 0 16px 0', color: '#d11a2a' }}>Delete Post</h3>
                <p style={{ margin: '0 0 20px 0' }}>
                    Are you sure you want to delete "{postTitle}"? This action cannot be undone.
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button 
                        onClick={onClose}
                        style={{
                            padding: '8px 16px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            background: '#fff',
                            cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={onConfirm}
                        style={{
                            padding: '8px 16px',
                            border: 'none',
                            borderRadius: '4px',
                            background: '#d11a2a',
                            color: '#fff',
                            cursor: 'pointer'
                        }}
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

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

    // Search and category state
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [categories, setCategories] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Delete modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [postToDelete, setPostToDelete] = useState(null);

    // Fetch available categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get('http://localhost:5555/api/categories');
                if (response.data.categories) {
                    setCategories(['All', ...response.data.categories]);
                }
            } catch (error) {
                console.log('Could not fetch categories');
                setCategories(['All', 'General', 'School Life', 'Gossip', 'Events', 'Sports', 'Academics', 'Teachers', 'Students', 'Activities', 'News']);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            try {
                let params = `limit=${POSTS_PER_PAGE}&skip=${(page-1)*POSTS_PER_PAGE}`;
                params += `&sortBy=${sortBy}&order=${order}`;
                if (dateFrom) params += `&dateFrom=${dateFrom}`;
                if (dateTo) params += `&dateTo=${dateTo}`;
                
                // Add category filter if not "All"
                if (selectedCategory && selectedCategory !== 'All') {
                    params += `&category=${encodeURIComponent(selectedCategory)}`;
                }
                
                console.log('Fetching posts with params:', params);
                console.log('Selected category:', selectedCategory);
                
                const response = await axios.get(`http://localhost:5555/api/recent-posts?${params}`);
                const newPosts = response.data.posts || [];
                // commentCount is now provided by backend as commentsCount
                const postsWithComments = newPosts.map(post => ({ ...post, commentCount: post.commentsCount ?? 0 }));
                setPosts(prev => page === 1 ? postsWithComments : [...prev, ...postsWithComments]);
                setTotal(response.data.total);
                setHasMore(((page - 1) * POSTS_PER_PAGE + newPosts.length) < response.data.total);
                
                console.log('Received posts:', newPosts.length, 'Total:', response.data.total);
            } catch (err) {
                console.error('Fetch posts error:', err);
                setError('Failed to load posts');
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
        // eslint-disable-next-line
    }, [page, sortBy, order, dateFrom, dateTo, selectedCategory]);

    // Search posts
    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            setIsSearching(false);
            setPage(1);
            return;
        }

        setIsSearching(true);
        setLoading(true);
        try {
            let params = `q=${encodeURIComponent(searchQuery.trim())}&limit=${POSTS_PER_PAGE}&skip=0`;
            params += `&sortBy=${sortBy}&order=${order}`;
            if (selectedCategory && selectedCategory !== 'All') {
                params += `&category=${encodeURIComponent(selectedCategory)}`;
            }
            
            console.log('Searching with params:', params);
            
            const response = await axios.get(`http://localhost:5555/api/search-posts?${params}`);
            const newPosts = response.data.posts || [];
            const postsWithComments = newPosts.map(post => ({ ...post, commentCount: post.commentsCount ?? 0 }));
            setPosts(postsWithComments);
            setTotal(response.data.total);
            setHasMore(newPosts.length === POSTS_PER_PAGE);
            setPage(1);
        } catch (err) {
            console.error('Search error:', err);
            setError('Failed to search posts');
        } finally {
            setLoading(false);
        }
    };

    // Clear search and return to normal posts
    const clearSearch = () => {
        setSearchQuery('');
        setIsSearching(false);
        setPage(1);
        setPosts([]);
        setHasMore(true);
        // Trigger a fresh fetch of posts with current category
        setPage(1);
    };

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

    // Handle post deletion
    const handleDeletePost = async () => {
        if (!postToDelete) return;
        
        try {
            await axios.delete(`http://localhost:5555/api/post/${postToDelete._id}`, {
                data: { userId }
            });
            
            // Remove the post from the local state
            setPosts(prevPosts => prevPosts.filter(post => post._id !== postToDelete._id));
            setDeleteModalOpen(false);
            setPostToDelete(null);
            
            // Show success message
            alert('Post deleted successfully');
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to delete post';
            alert(errorMessage);
        }
    };

    // Open delete modal
    const openDeleteModal = (post) => {
        setPostToDelete(post);
        setDeleteModalOpen(true);
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
            {/* Delete confirmation modal */}
            <DeleteConfirmModal
                isOpen={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setPostToDelete(null);
                }}
                onConfirm={handleDeletePost}
                postTitle={postToDelete?.postTitle || ''}
            />
            <h2>Posts</h2>
            
            {/* Search and Category Filter */}
            <div style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '18px',
                flexWrap: 'wrap',
                alignItems: 'center',
                padding: '16px',
                background: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
            }}>
                <div style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '300px' }}>
                    <input
                        type="text"
                        placeholder="Search posts by title, content, or category..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        style={{
                            flex: 1,
                            padding: '8px 12px',
                            border: '1px solid #ced4da',
                            borderRadius: '4px',
                            fontSize: '14px'
                        }}
                    />
                    <button
                        onClick={handleSearch}
                        style={{
                            padding: '8px 16px',
                            background: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        🔍 Search
                    </button>
                    {isSearching && (
                        <button
                            onClick={clearSearch}
                            style={{
                                padding: '8px 16px',
                                background: '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            ✕ Clear
                        </button>
                    )}
                </div>
                
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    style={{
                        padding: '8px 12px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '14px',
                        minWidth: '150px'
                    }}
                >
                    {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>
            
            {/* Search Results Info */}
            {isSearching && (
                <div style={{
                    background: '#e7f3ff',
                    border: '1px solid #b3d9ff',
                    borderRadius: '4px',
                    padding: '12px',
                    marginBottom: '18px',
                    color: '#0066cc'
                }}>
                    🔍 Search results for "{searchQuery}" {selectedCategory !== 'All' && `in ${selectedCategory}`} 
                    ({total} posts found)
                </div>
            )}
            
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
                    return (
                        <div
                            className="post-card"
                            key={post._id}
                            onClick={e => {
                                if (e.target.tagName !== 'BUTTON') handlePostClick(post._id);
                            }}
                            style={{
                                cursor: 'pointer',
                                ...(post.deleted ? {
                                    outline: '2px solid black',
                                    background: '#f8f8f8',
                                } : post.commentsDisabled ? {
                                    outline: '2px solid #b88600',
                                    background: '#fffbe6',
                                } : {})
                            }}
                        >
                            <h3
                                className="post-title"
                                style={post.deleted ? {
                                    color: 'black',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                } : post.commentsDisabled ? {
                                    color: '#b88600',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                } : {}}
                            >
                                {post.deleted && <span style={{color:'#b00',fontWeight:'bold',fontSize:'1.1em',marginRight:4}} title="Deleted post">⚠️</span>}
                                {post.commentsDisabled && !post.deleted && <span style={{color:'#b88600',fontWeight:'bold',fontSize:'1.1em',marginRight:4}} title="Paused post">⏸️</span>}
                                {post.postTitle}
                                {post.deleted && <span style={{marginLeft:8, color:'#b00', fontWeight:'bold', fontSize:'0.97em'}}>Deleted by admin</span>}
                                {post.commentsDisabled && !post.deleted && <span style={{marginLeft:8, color:'#b88600', fontWeight:'bold', fontSize:'0.97em'}}>Interaction paused</span>}
                            </h3>
                            <div className="post-meta">
                                By {post.fullName} on {post.creationDate ? new Date(post.creationDate).toLocaleString() : ''}
                                {post.category && (
                                    <span style={{
                                        marginLeft: '12px',
                                        background: '#e9ecef',
                                        color: '#495057',
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '0.85em',
                                        fontWeight: '500'
                                    }}>
                                        📂 {post.category}
                                    </span>
                                )}
                            </div>
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
                                {userId && post.userID === userId && !post.deleted && (
                                    <button
                                        style={{
                                            background: '#d11a2a',
                                            color: '#fff',
                                            border: 'none',
                                            padding: '8px 16px',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            marginLeft: 'auto'
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openDeleteModal(post);
                                        }}
                                    >
                                        🗑️ Delete
                                    </button>
                                )}
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