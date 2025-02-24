import React, { useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import Test from './test';

const CreatePostPage = () => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const userCookie = Cookies.get('user');
            if (!userCookie) {
                alert("You're not logged in, or your cookies have expired. Please log in again.");
                navigate('/login');
                return;
            }
            const userDATA = JSON.parse(userCookie);
            const response = await axios.post('http://localhost:5555/api/createpost', {
                userCookie: userDATA,
                fullName: userDATA.fullName,
                userId: userDATA.userId,
                postTitle: title,
                postContent: content,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            console.log('Create post response:', response.data);
            if (response.data.success) {
                console.log('Post created successfully:', response.data);
                if (response.data.error) {
                    console.error('Error creating post:', response.data.error.message);
                    alert(response.data.error.message);
                    return;
                } else {
                    alert("Post created successfully");
                    navigate('/');
                }
            } else {
                alert('Failed to create post');
            }
        } catch (error) {
            console.error('Error creating post:', error);
            alert('An error occurred while creating the post');
        }
    };

    return (
        <div>
            <h2>Create Post</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="title">Title:</label>
                    <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="content">Content:</label>
                    <input
                        id="content"
                        type="text"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        required
                    ></input>
                </div>
                <button type="submit">Create Post</button>
            </form>
        </div>
    );
};

export default CreatePostPage;