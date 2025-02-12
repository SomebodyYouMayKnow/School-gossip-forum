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

    const handleSubmit = async (event) => {
        event.preventDefault();
        console.log('Email:', email);
        console.log('Full Name:', fullName);
        console.log('Password:', password);
        try {
            const response = await axios.post('http://localhost:5555/Register', {
                email: email,
                fullName: fullName,
                password: password
            }, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (response.data.token) {
                const data = {
                    token: response.data.token,
                    userId: response.data.userId,
                    fullName: response.data.fullName,
                    email: response.data.email,
                    admin: response.data.admin,
                };
                console.log(data);

                // Set cookie with user data, expires in 24 hours
                Cookies.set('user', JSON.stringify(data), { expires: 1 });

                // Redirect to home page
                navigate('/');
            } else {
                alert(response.data.error.message);
            }
        } catch (e) {
            console.log(e);
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
                        Full Name
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