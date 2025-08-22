import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import './Pages.css';
import { BACKEND_ADDRESS } from '../config/api';

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
            console.log('Sending cookie data:', userData);
            
            const response = await axios.post(`${BACKEND_ADDRESS}/api/checkcookie`, userData, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            console.log('Response:', response.data);

            if (response.data.success) {
                setCookieStatus('Cookie is valid! User authenticated.');
                console.log('User data:', response.data.userData);
            } else {
                setCookieStatus(`Cookie validation failed: ${response.data.message}`);
                console.log('Validation failure details:', response.data);
            }

        } catch (error) {
            setCookieStatus('Error checking cookie: ' + error.message);
            console.error('Error:', error);
        }
    };

    const testConnection = async () => {
        try {
            const response = await axios.get(`${BACKEND_ADDRESS}/test`);
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
};

export default Test;
