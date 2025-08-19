import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import './Pages.css';


const viewPosts = () => {
    const handleFetchRecentPosts = async () => {
        try {
            const response = await axios.get('http://localhost:5555/api/recent-posts');
            console.log('Recent posts:', response.data);
        } catch (error) {
            console.error('Error fetching recent posts:', error);
        }
    };

    return (
        <div>
            <h2>Home</h2>
            <button className="button-primary" onClick={handleFetchRecentPosts}>
                Fetch Recent Posts
            </button>
        </div>
    );
}

export default viewPosts