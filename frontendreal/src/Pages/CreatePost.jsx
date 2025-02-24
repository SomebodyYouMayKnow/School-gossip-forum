import React, { useState } from 'react';
import axios from 'axios';
<<<<<<< HEAD
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import Test from './test';
=======
import { useNavigate } from 'react-router-dom';
>>>>>>> 67d63bdb7091ff790fd2ee2c300f674674352e0b

const CreatePostPage = () => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
<<<<<<< HEAD
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
=======
            const response = await axios.post('http://localhost:5555/api/createpost', {
                title: title,
                content: content
>>>>>>> 67d63bdb7091ff790fd2ee2c300f674674352e0b
            }, {
                headers: {
                    'Content-Type': 'application/json',
                },
<<<<<<< HEAD
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
=======
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
>>>>>>> 67d63bdb7091ff790fd2ee2c300f674674352e0b
        }
    };

    return (
        <div>
<<<<<<< HEAD
            <h2>Create Post</h2>
=======
            <h2>Create Note</h2>
>>>>>>> 67d63bdb7091ff790fd2ee2c300f674674352e0b
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
<<<<<<< HEAD
                    <input
                        id="content"
                        type="text"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        required
                    ></input>
                </div>
                <button type="submit">Create Post</button>
=======
                    <textarea
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        required
                    ></textarea>
                </div>
                <button type="submit">Create Note</button>
>>>>>>> 67d63bdb7091ff790fd2ee2c300f674674352e0b
            </form>
        </div>
    );
};

export default CreatePostPage;