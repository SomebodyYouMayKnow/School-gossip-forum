
import React, { useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import './Pages.css';

const Test = () => {
    const [cookieStatus, setCookieStatus] = useState('');

    const checkCookie = async () => {
        try {
            const userCookie = Cookies.get('user');

            if (!userCookie) {
                setCookieStatus('No user cookie found!');
                return;
            }

            const userData = JSON.parse(userCookie);
            console.log('Sending cookie data:', userData); // Debug log

            // Updated endpoint
            const response = await axios.post('http://localhost:5555/api/checkcookie', userData, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            console.log('Response:', response.data); // Debug log

            if (response.data.valid) {
                setCookieStatus('Cookie is valid! User authenticated.');
                console.log('User data:', response.data.userData);
            } else {
                setCookieStatus('Cookie validation failed: ' + response.data.message);
                console.log('Validation failure details:', response.data);
            }

        } catch (error) {
            setCookieStatus('Error checking cookie: ' + error.message);
            console.error('Error:', error);
        }
    };

    // Add a test function to verify server connection
    const testConnection = async () => {
        try {
            const response = await axios.get('http://localhost:5555/test');
            console.log('Test response:', response.data);
            setCookieStatus('Server test successful: ' + response.data.message);
        } catch (error) {
            setCookieStatus('Server test failed: ' + error.message);
            console.error('Test error:', error);
        }
    };

    return (
        <div className="test-container">
            <h2>Cookie Test Page</h2>
            <button
                className="button-submit"
                onClick={checkCookie}
                style={{ marginRight: '10px' }}
            >
                Check Cookie
            </button>
            <button
                className="button-submit"
                onClick={testConnection}
            >
                Test Server Connection
            </button>
            {cookieStatus && (
                <div className="status-message">
                    <p>{cookieStatus}</p>
                </div>
            )}
        </div>
    );
}; export default Test;