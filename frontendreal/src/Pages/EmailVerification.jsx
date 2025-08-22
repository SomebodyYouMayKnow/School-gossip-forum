import React, { useState } from 'react';
import axios from 'axios';
import './Pages.css';
import { BACKEND_ADDRESS } from '../config/api';
import { useSearchParams, useNavigate } from 'react-router-dom';

function EmailVerification() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
    const [message, setMessage] = useState('Verifying your email...');
    const [email, setEmail] = useState('');
    const hasVerified = useState(false);

    useState(() => {
        const token = searchParams.get('token');
        
        if (!token) {
            setStatus('error');
            setMessage('Invalid verification link. No token provided.');
            return;
        }

        // Prevent multiple verification attempts
        if (!hasVerified) {
            hasVerified(true);
            verifyEmail(token);
        }
    }, [searchParams]);

    const verifyEmail = async (token) => {
        try {
            const response = await axios.get(`${BACKEND_ADDRESS}/api/verify-email?token=${token}`);

            const data = response.data;

            if (data.success) {
                setStatus('success');
                setMessage('Email verified successfully! You can now log in and start posting.');
                setEmail(data.user?.email || '');
                
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    navigate('/Login');
                }, 3000);
            } else {
                setStatus('error');
                setMessage(data.message || 'Email verification failed.');
            }
        } catch (error) {
            console.error('Verification error:', error);
            setStatus('error');
            setMessage('Network error. Please try again later.');
        }
    };

    const resendVerification = async () => {
        if (!email) {
            alert('Please enter your email address');
            return;
        }

        try {
            const response = await axios.post(`${BACKEND_ADDRESS}/api/resend-verification`, { email: email });

            const data = await response.json();
            
            if (data.success) {
                alert('Verification email sent! Please check your inbox.');
            } else {
                alert(data.message || 'Failed to resend verification email.');
            }
        } catch (error) {
            console.error('Resend error:', error);
            alert('Network error. Please try again later.');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-form">
                <h2>Email Verification</h2>
                
                {status === 'verifying' && (
                    <div className="verification-status">
                        <div className="loading-spinner"></div>
                        <p>{message}</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="verification-status success">
                        <div className="success-icon">✅</div>
                        <h3>Verification Successful!</h3>
                        <p>{message}</p>
                        {email && <p className="email-info">Email: <strong>{email}</strong></p>}
                        <p className="redirect-info">Redirecting to login in 3 seconds...</p>
                        <button 
                            onClick={() => navigate('/Login')} 
                            className="btn btn-primary"
                        >
                            Go to Login Now
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="verification-status error">
                        <div className="error-icon">❌</div>
                        <h3>Verification Failed</h3>
                        <p>{message}</p>
                        
                        <div className="resend-section">
                            <h4>Need a new verification email?</h4>
                            <input
                                type="email"
                                placeholder="Enter your email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="form-input"
                            />
                            <button 
                                onClick={resendVerification}
                                className="btn btn-secondary"
                            >
                                Resend Verification Email
                            </button>
                        </div>

                        <div className="navigation-buttons">
                            <button 
                                onClick={() => navigate('/Register')} 
                                className="btn btn-outline"
                            >
                                Back to Register
                            </button>
                            <button 
                                onClick={() => navigate('/Login')} 
                                className="btn btn-outline"
                            >
                                Try Login
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .verification-status {
                    text-align: center;
                    padding: 20px;
                }

                .loading-spinner {
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #667eea;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .success-icon, .error-icon {
                    font-size: 48px;
                    margin-bottom: 20px;
                }

                .success {
                    color: #28a745;
                }

                .error {
                    color: #dc3545;
                }

                .email-info {
                    background: #f8f9fa;
                    padding: 10px;
                    border-radius: 5px;
                    margin: 15px 0;
                }

                .redirect-info {
                    font-style: italic;
                    color: #666;
                    margin: 15px 0;
                }

                .resend-section {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                }

                .resend-section h4 {
                    margin-bottom: 15px;
                    color: #333;
                }

                .navigation-buttons {
                    display: flex;
                    gap: 10px;
                    justify-content: center;
                    margin-top: 20px;
                }

                .btn {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.3s ease;
                }

                .btn-primary {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }

                .btn-secondary {
                    background: #6c757d;
                    color: white;
                }

                .btn-outline {
                    background: transparent;
                    border: 1px solid #667eea;
                    color: #667eea;
                }

                .btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                }

                .form-input {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    margin-bottom: 15px;
                    font-size: 14px;
                }
            `}</style>
        </div>
    );
}

export default EmailVerification;
