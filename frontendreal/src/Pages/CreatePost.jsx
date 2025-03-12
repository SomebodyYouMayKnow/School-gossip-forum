import React, { useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

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
        <form onSubmit={handleSubmit}>
            <div>
                <label>Title:</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
                <label>Content:</label>
                <textarea value={content} onChange={(e) => setContent(e.target.value)} required />
            </div>
            <button type="submit">Submit</button>
        </form>
    );
};

export default CreatePost;