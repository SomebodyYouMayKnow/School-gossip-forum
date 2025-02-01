import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from 'axios';


let data = {
    token: "",
    userId: "",
    fullName: "",
    email: "",
    admin: "",
}

export const Register = (props) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    async function handleSubmit(event) {
        event.preventDefault();
        try {
            const response = await axios.get(`http://localhost:5555/register?email=${email}&fullName=${name}&password=${password}`, {}, {
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
                console.log(data);
                return data;
            } else /**if (Object.values(response.data).length === 1)**/ {
                console.log(response.data.error.message);
                return response.data.error.message;
            }
        } catch (e) {
            console.log(e);
        }
    }


    return (
        <div className="Forms_Register">
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
                <div className="col-md-6">
                    <label htmlFor="inputNname" className="form-label">
                        Name
                    </label>
                    <input
                        type="text"
                        className="form-control"
                        id="inputName"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                    />
                </div>
                <div className="col-12">
                    <button type="submit" className="btn btn-primary">
                        Register
                    </button>
                </div>
            </form>
            <Link to="/login">Already have an account? Login here</Link>
        </div>
    );
};