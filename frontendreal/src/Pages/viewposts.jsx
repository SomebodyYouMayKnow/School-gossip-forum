import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import './Pages.css';



const ViewPosts = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const response = await axios.get('http://localhost:5555/api/recent-posts');
                setPosts(response.data.posts || []);
            } catch (err) {
                setError('Failed to load posts');
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, []);


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

    return (
        <div className="posts-container">
            <h2>Recent Posts</h2>
            {loading && <p>Loading...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {posts.length === 0 && !loading && !error && <p>No posts found.</p>}
            <div className="posts-list">
                {posts.map(post => (
                    <div className="post-card" key={post._id} onClick={() => handlePostClick(post._id)} style={{ cursor: 'pointer' }}>
                        <h3 className="post-title">{post.postTitle}</h3>
                        <div className="post-meta">By {post.fullName} on {post.creationDate ? new Date(post.creationDate).toLocaleString() : ''}</div>
                        <div className="post-content post-preview">{stripHtml(post.postContent).slice(0, 180)}{stripHtml(post.postContent).length > 180 ? '...' : ''}</div>
                        <div className="post-toggle-tip">Click to view full post</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ViewPosts