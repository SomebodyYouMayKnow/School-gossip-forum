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
        if (postId) fetchPost();
        // eslint-disable-next-line
    }, [postId]);

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
        </div>
    );
};

export default PostDetail;
