import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import './Pages.css';

const Login = () => {
    const [email, setEmail] = useState('');
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
        console.log('Email:', email);
        console.log('Password:', password);

        try {
            const response = await axios.post('http://localhost:5555/api/Login', {
                email: email,
                password: password
            }, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            console.log("Server response:", response.data); // Debugging log

            if (response.data.token) {
                const data = {
                    token: response.data.token,
                    userId: response.data.userId,
                    fullName: response.data.fullName,
                    email: response.data.email,
                    admin: response.data.admin,
                };

                console.log("Login successful:", data);
                Cookies.set('user', JSON.stringify(data), { expires: 1 });

                // Redirect to home page
                navigate('/');
            } else {
                console.warn("Login failed:", response.data);
                alert(response.data.error?.message || response.data.message || "Login failed. Please try again.");
            }
        } catch (error) {
            console.error("Login request failed:", error);
            alert("An error occurred. Please check your internet connection and try again.");
        }
    };

    return (
        <div className="Forms_Sign_In">
            <h2>Sign In</h2>
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
                        Sign in
                    </button>
                </div>
                <div className="col-12">
                    <a href="/Register" className="link-account">
                        Don't have an account? Register here
                    </a>
                </div>
            </form>
        </div>
    );
};

export default Login;
