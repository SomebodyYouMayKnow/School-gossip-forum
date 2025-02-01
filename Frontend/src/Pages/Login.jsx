import { Link } from "react-router-dom";
import React, { useState } from "react";
import axios from 'axios';

let data = {
    token: "",
    userId: "",
    fullName: "",
    email: "",
    admin: "",
}

export const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    async function handleSubmit(event) {
        event.preventDefault();
        try {
            const response = await axios.get(`http://localhost:5555/Login?email=${email}&password=${password}`, {}, {
                headers: {
                    'Content-Type': 'text/plain',
                },
            });
            if (Object.values(response.data).length === 5) {
                data.token = response.data.token;
                data.userId = response.data.userId;
                data.fullName = response.data.fullName;
                data.email = response.data.email;
                data.admin = response.data.admin;
                return data;
            } else /**if (Object.values(response.data).length === 1)**/ {
                return response.data.error.message;
            }
        } catch (e) {
            console.log(e);
        }

    };

    return (
        <div className="Forms_Sign_In">
            <form className="row g-3" onSubmit={handleSubmit}>
                <div className="col-md-6">
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
                <div className="col-md-6">
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
                    <button type="submit" className="btn btn-primary">
                        Sign in
                    </button>
                </div>
            </form>
            <Link to="/register">Register</Link>
        </div>
    );
};