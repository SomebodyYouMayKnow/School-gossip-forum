import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const CreatePost = () => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const userCookie = Cookies.get('user');
                    
        if (!userCookie) {
            console.log('No user cookie found');
            return;
        }
        
        const userData = JSON.parse(userCookie);
        console.log('Sending cookie data:', userData);
        const postData = {
            userCookie: userData,
            postTitle: title,
            postContent: content
        };

        try {
            const response = await axios.post('http://localhost:5555/api/createpost', postData, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            console.log('Create post response:', response.data);
            if (response.data.success) {
                // Redirect to the new post's URL (assuming response.data.post._id)
                const postId = response.data.post?._id || response.data.postId;
                if (postId) {
                    navigate(`/posts?postid=${postId}`);
                } else {
                    alert('Post created, but could not find post ID to redirect.');
                }
            } else {
                alert(response.data.error?.message || 'Failed to create post.');
            }
        } catch (error) {
            alert('Error creating post: ' + error.message);
        }
    };

    return (
        <div className="create-post-container">
            <h2 className="create-post-title">Create a New Post</h2>
            <form className="create-post-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="post-title" className="form-label">Title</label>
                    <input
                        id="post-title"
                        className="form-input"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        placeholder="Enter your post title"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="post-content" className="form-label">Content</label>
                    <ReactQuill
                        id="post-content"
                        className="form-quill"
                        value={content}
                        onChange={setContent}
                        placeholder="Write your post here..."
                    />
                </div>
                <button className="submit-btn" type="submit">Submit</button>
            </form>
        </div>
    );
};

export default CreatePost;