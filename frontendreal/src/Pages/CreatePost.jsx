import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CreatePostPage = () => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5555/api/createpost', {
                title: title,
                content: content
            }, {
                headers: {
                    'Content-Type': 'application/json',
                },
                withCredentials: true // Include cookies in the request
            });
            if (response.status === 201) {
                navigate('/notes');
            } else {
                alert('Failed to create note');
            }
        } catch (error) {
            console.error('Error creating note:', error);
            alert('An error occurred while creating the note');
        }
    };

    return (
        <div>
            <h2>Create Note</h2>
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
                    <textarea
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        required
                    ></textarea>
                </div>
                <button type="submit">Create Note</button>
            </form>
        </div>
    );
};

export default CreatePostPage;