import React, { useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const CreatePost = () => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

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
                alert('Post created successfully');
            } else {
                alert(response.data.error.message);
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