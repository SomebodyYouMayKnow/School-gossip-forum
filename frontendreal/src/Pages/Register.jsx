// filepath: /c:/Dev/School-gossip-forum/frontendreal/src/Pages/Register.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import './Pages.css';







const Register = () => {
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    // Redirect to home if already logged in
    React.useEffect(() => {
        const userCookie = Cookies.get('user');
        if (userCookie) {
            navigate('/');
        }
    }, [navigate]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        
        try {
            const response = await axios.post('http://localhost:5555/api/Register', {
                email: email,
                fullName: fullName,
                password: password
            }, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            // Handle successful registration (email verification required)
            if (response.data.success) {
                const message = response.data.isResend 
                    ? 'New verification email sent! Please check your inbox and click the verification link.'
                    : 'Registration successful! Please check your email and click the verification link to activate your account.';
                
                alert(message);
                
                // Redirect to login page
                navigate('/Login');
            } else {
                // Handle registration errors
                alert(response.data.error?.message || 'Registration failed. Please try again.');
            }
        } catch (error) {
            console.error('Registration error:', error);
            
            // Handle network or server errors
            if (error.response?.data?.error?.message) {
                alert(error.response.data.error.message);
            } else {
                alert('Network error. Please check your connection and try again.');
            }
        }
    };

    return (
        <div className="Forms_Sign_Up">
            <h2>Sign Up</h2>
            <form className="row g-3" onSubmit={handleSubmit}>
                <div className="col-md-12">
                    <label htmlFor="inputEmail4" className="form-label">
                        Email
                    </label>
                    <input
                        type="email"
                        className="form-control"
                        id="inputEmail4"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                    />
                </div>
                <div className="col-md-12">
                    <label htmlFor="inputFullName4" className="form-label">
                        Username
                    </label>
                    <input
                        type="text"
                        className="form-control"
                        id="inputFullName4"
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                    />
                </div>
                <div className="col-md-12">
                    <label htmlFor="inputPassword4" className="form-label">
                        Password
                    </label>
                    <input
                        type="password"
                        className="form-control"
                        id="inputPassword4"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                    />
                </div>
                <div className="col-12">
                    <button type="submit" className="button-submit">
                        Sign up
                    </button>
                </div>
                <div className="col-12">
                    <a href="/Login" className="link-account">
                        Already have an account? Login here
                    </a>
                </div>
            </form>
        </div>
    );
};

export default Register;