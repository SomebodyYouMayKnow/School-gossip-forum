import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import './Pages.css';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { BACKEND_ADDRESS } from '../config/api';

const CreatePost = () => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('General');
    const [customCategory, setCustomCategory] = useState('');
    const [showCustomCategory, setShowCustomCategory] = useState(false);
    const [availableCategories, setAvailableCategories] = useState([]);
    const [selectedImages, setSelectedImages] = useState([]);
    const [imagePreview, setImagePreview] = useState([]);
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
                const response = await axios.get(`${BACKEND_ADDRESS}/api/categories`);
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
        
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('userCookie', JSON.stringify(userData));
        formData.append('postTitle', title);
        formData.append('postContent', content);
        formData.append('category', finalCategory);
        
        // Append images if any
        selectedImages.forEach((image, index) => {
            formData.append('images', image);
        });

        try {
            const response = await axios.post(`${BACKEND_ADDRESS}/api/createpost`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
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

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        
        // Validate file types and sizes
        const validFiles = files.filter(file => {
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            const maxSize = 5 * 1024 * 1024; // 5MB
            
            if (!validTypes.includes(file.type)) {
                alert(`${file.name} is not a valid image type. Please use JPEG, PNG, GIF, or WebP.`);
                return false;
            }
            
            if (file.size > maxSize) {
                alert(`${file.name} is too large. Please use images under 5MB.`);
                return false;
            }
            
            return true;
        });
        
        // Limit to 5 images total
        const totalImages = selectedImages.length + validFiles.length;
        if (totalImages > 5) {
            alert('You can only upload up to 5 images per post.');
            return;
        }
        
        setSelectedImages(prev => [...prev, ...validFiles]);
        
        // Create preview URLs
        const newPreviews = validFiles.map(file => URL.createObjectURL(file));
        setImagePreview(prev => [...prev, ...newPreviews]);
    };
    
    const removeImage = (index) => {
        // Revoke the object URL to free memory
        URL.revokeObjectURL(imagePreview[index]);
        
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
        setImagePreview(prev => prev.filter((_, i) => i !== index));
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
                <div className="form-group">
                    <label htmlFor="post-images" className="form-label">Images (Optional)</label>
                    <input
                        id="post-images"
                        className="form-input"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageChange}
                        style={{ padding: '8px' }}
                    />
                    <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                        Upload up to 5 images (JPEG, PNG, GIF, WebP). Max 5MB each.
                    </small>
                    {imagePreview.length > 0 && (
                        <div className="image-preview-container" style={{ marginTop: '12px' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {imagePreview.map((preview, index) => (
                                    <div key={index} style={{ position: 'relative', display: 'inline-block' }}>
                                        <img
                                            src={preview}
                                            alt={`Preview ${index + 1}`}
                                            style={{
                                                width: '100px',
                                                height: '100px',
                                                objectFit: 'cover',
                                                borderRadius: '4px',
                                                border: '1px solid #ddd'
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            style={{
                                                position: 'absolute',
                                                top: '-8px',
                                                right: '-8px',
                                                background: '#ff4444',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: '20px',
                                                height: '20px',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <button className="submit-btn" type="submit">Submit</button>
            </form>
        </div>
    );
};

export default CreatePost;