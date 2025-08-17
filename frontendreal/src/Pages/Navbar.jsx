import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Pages.css'; // Ensure you have a CSS file for styling

import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
    const [isSignedIn, setIsSignedIn] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const checkCookie = () => {
            const userCookie = Cookies.get('user');
            setIsSignedIn(!!userCookie);
        };
        checkCookie();
        // Listen for cookie changes (sign in/out from other tabs)
        const interval = setInterval(checkCookie, 500);
        return () => clearInterval(interval);
    }, []);

    const handleSignOut = () => {
        Cookies.remove('user');
        setIsSignedIn(false);
        navigate('/');
    };

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
                    {isSignedIn ? (
                        <>
                            <li className="nav-item">
                                <Link to="/Createpost" className="nav-links button">
                                    Create Post
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link to="#" className="nav-links button" onClick={e => { e.preventDefault(); handleSignOut(); }}>
                                    Sign Out
                                </Link>
                            </li>
                        </>
                    ) : (
                        <>
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
                        </>
                    )}
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;