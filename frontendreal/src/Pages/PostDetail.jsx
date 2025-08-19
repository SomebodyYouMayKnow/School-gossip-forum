import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
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

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const response = await axios.get(`http://localhost:5555/api/post/${postId}`);
                setPost(response.data.post);
            } catch (err) {
                setError('Failed to load post');
            } finally {
                setLoading(false);
            }
        };
        if (postId) fetchPost();
    }, [postId]);

    if (loading) return <div className="posts-container"><p>Loading...</p></div>;
    if (error) return <div className="posts-container"><p style={{ color: 'red' }}>{error}</p></div>;
    if (!post) return <div className="posts-container"><p>Post not found.</p></div>;

    return (
        <div className="posts-container">
            <div className="post-card">
                <h2 className="post-title">{post.postTitle}</h2>
                <div className="post-meta">By {post.fullName} on {post.creationDate ? new Date(post.creationDate).toLocaleString() : ''}</div>
                <div className="post-content" dangerouslySetInnerHTML={{ __html: post.postContent }} />
            </div>
        </div>
    );
};

export default PostDetail;
