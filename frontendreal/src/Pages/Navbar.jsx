import React from 'react';
import { Link } from 'react-router-dom';
import './Pages.css'; // Ensure you have a CSS file for styling

const Navbar = () => {
    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-logo">
                    Notes
                </Link>
                <div className="menu-icon">
                    <i className="fas fa-bars"></i>
                </div>
                <ul className="nav-menu">
                    <li className="nav-item">
                        <Link to="/" className="nav-links">
                            Home
                        </Link>
                    </li>
                    <li className="nav-item">
                        <Link to="/Login" className="nav-links button">
                            Login
                        </Link>
                    </li>
                    <li className="nav-item">
                        <Link to="/Register" className="nav-links button">
                            Register
                        </Link>
                    </li>
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;