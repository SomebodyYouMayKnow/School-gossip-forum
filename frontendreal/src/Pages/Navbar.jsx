import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Pages.css';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';

const Navbar = () => {
    const [isSignedIn, setIsSignedIn] = useState(false);
    const [click, setClick] = useState(false);
    const navigate = useNavigate();
    
    const handleClick = () => setClick(!click);
    const closeMobileMenu = () => setClick(false);

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
                <Link to="/" className="navbar-logo" onClick={closeMobileMenu}>
                    bell -forum
                </Link>
                <div className="menu-icon" onClick={handleClick}>
                    {click ? <FaTimes /> : <FaBars />}
                </div>
                <ul className={click ? 'nav-menu active' : 'nav-menu'}>
                    <li className="nav-item">
                        <Link to="/" className="nav-links" onClick={closeMobileMenu}>
                            Home
                        </Link>
                    </li>
                    <li className="nav-item">
                        <Link to="/viewposts" className="nav-links" onClick={closeMobileMenu}>
                            View Posts
                        </Link>
                    </li>
                    <li className="nav-item">
                        <Link to="/polls" className="nav-links" onClick={closeMobileMenu}>
                            Polls
                        </Link>
                    </li>
                    <li className="nav-item">
                        <Link to="/chat" className="nav-links" onClick={closeMobileMenu}>
                            Chat
                        </Link>
                    </li>
                    <li className="nav-item">
                        <Link to="/contact" className="nav-links" onClick={closeMobileMenu}>
                            Contact
                        </Link>
                    </li>
                    <li className="nav-item">
                        <Link
                            to="/Createpost"
                            className="nav-links button"
                            onClick={e => {
                                if (!isSignedIn) {
                                    e.preventDefault();
                                    closeMobileMenu();
                                    alert('You must be logged in to create a post. Please log in or create an account.');
                                    navigate('/Login');
                                } else {
                                    closeMobileMenu();
                                }
                            }}
                        >
                            Create Post
                        </Link>
                    </li>
                    {isSignedIn ? (
                        <li className="nav-item">
                            <Link 
                                to="#" 
                                className="nav-links button" 
                                onClick={e => { 
                                    e.preventDefault(); 
                                    closeMobileMenu();
                                    handleSignOut(); 
                                }}
                            >
                                Sign Out
                            </Link>
                        </li>
                    ) : (
                        <>
                            <li className="nav-item">
                                <Link to="/Login" className="nav-links button" onClick={closeMobileMenu}>
                                    Login
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link to="/Register" className="nav-links button" onClick={closeMobileMenu}>
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