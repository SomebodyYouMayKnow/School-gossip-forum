import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const CreatePost = () => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('General');
    const [customCategory, setCustomCategory] = useState('');
    const [showCustomCategory, setShowCustomCategory] = useState(false);
    const [availableCategories, setAvailableCategories] = useState([]);
    const navigate = useNavigate();

    // Predefined categories
    const predefinedCategories = [
        'General', 'School Life', 'Gossip', 'Events', 'Sports', 
        'Academics', 'Teachers', 'Students', 'Activities', 'News', 'Bell Sleeping', 'Other'
    ];

    useEffect(() => {
        // Fetch existing categories from the database
        const fetchCategories = async () => {
            try {
                const response = await axios.get('http://localhost:5555/api/categories');
                if (response.data.categories) {
                    setAvailableCategories(response.data.categories);
                }
            } catch (error) {
                console.log('Could not fetch categories, using predefined ones');
            }
        };
        fetchCategories();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const userCookie = Cookies.get('user');
                    
        if (!userCookie) {
            console.log('No user cookie found');
            return;
        }
        
        const userData = JSON.parse(userCookie);
        console.log('Sending cookie data:', userData);
        
        // Use custom category if selected, otherwise use predefined
        const finalCategory = showCustomCategory ? customCategory : category;
        
        const postData = {
            userCookie: userData,
            postTitle: title,
            postContent: content,
            category: finalCategory
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

    const handleCategoryChange = (e) => {
        const selectedCategory = e.target.value;
        if (selectedCategory === 'Custom') {
            setShowCustomCategory(true);
            setCategory('Custom');
        } else {
            setShowCustomCategory(false);
            setCategory(selectedCategory);
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
                    <label htmlFor="post-category" className="form-label">Category</label>
                    <select
                        id="post-category"
                        className="form-input"
                        value={category}
                        onChange={handleCategoryChange}
                        required
                    >
                        {predefinedCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                        <option value="Custom">Custom Category</option>
                    </select>
                    {showCustomCategory && (
                        <input
                            className="form-input"
                            type="text"
                            value={customCategory}
                            onChange={(e) => setCustomCategory(e.target.value)}
                            placeholder="Enter custom category"
                            required
                            style={{ marginTop: '8px' }}
                        />
                    )}
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