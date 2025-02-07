import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import './Pages.css';

const Register = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const navigate = useNavigate();

    async function handleSubmit(event) {
        event.preventDefault();
        try {
            const response = await axios.get(`http://localhost:5555/register?email=${email}&fullName=${name}&password=${password}`, {}, {
                headers: {
                    'Content-Type': 'text/plain',
                },
            });
            if (Object.values(response.data).length === 5) {
                const data = {};
                data.token = response.data.token;
                data.userId = response.data.userId;
                data.fullName = response.data.fullName;
                data.email = response.data.email;
                data.admin = response.data.admin;
                console.log(data);
                // Redirect to home page
                navigate('/login');
            } else {
                alert(response.data.error.message);
            }
        } catch (e) {
            console.log(e);
        }
    }

    return (
        <div className="Forms_Register">
            <h2>Register</h2>
            <form className="row g-3" onSubmit={handleSubmit}>
                <div className="col-md-12">
                    <label htmlFor="inputName" className="form-label">
                        Full Name
                    </label>
                    <input
                        type="text"
                        className="form-control"
                        id="inputName"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                    />
                </div>
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
                        Register
                    </button>
                </div>
                <div className="col-12">
                    <a href="/Login" className="link-account">
                        Already have an account? Sign in here
                    </a>
                </div>
            </form>
        </div>
    );
};

export default Register;