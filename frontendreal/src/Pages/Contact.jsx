import React from 'react';
import './Pages.css';

const Contact = () => {
    const supportEmail = 'school.forum.management@gmail.com';

    return (
        <div className="contact-container">
            <div className="contact-content">
                <h1>Need Help?</h1>
                
                <div className="contact-section">
                    <div className="help-item">
                        <h3>🐛 Found bugs?</h3>
                        <p>Report any issues you encounter while using the forum</p>
                    </div>
                    
                    <div className="help-item">
                        <h3>❓ Can't do something?</h3>
                        <p>Having trouble with a feature or need assistance?</p>
                    </div>
                    
                    <div className="help-item">
                        <h3>💡 Have ideas?</h3>
                        <p>Share your suggestions for improving the forum</p>
                    </div>
                </div>

                <div className="contact-email">
                    <h2>Send an email to:</h2>
                    <a href={`mailto:${supportEmail}`} className="email-link">
                        {supportEmail}
                    </a>
                </div>

                <div className="contact-info">
                    <p>We'll get back to you as soon as possible!</p>
                    <p>Please include as much detail as possible when reporting bugs or requesting help.</p>
                </div>
            </div>
        </div>
    );
};

export default Contact;
