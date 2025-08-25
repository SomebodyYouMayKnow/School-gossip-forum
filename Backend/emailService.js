const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const config = require('./config.js');

class EmailService {
    constructor() {
        // Configure SMTP transporter
        this.transporter = nodemailer.createTransport({
            service: 'gmail', // or your preferred email service
            auth: {
                user: config.emailUser, // Your email from config.js
                pass: config.emailPass  // App password from config.js
            }
        });
    }

    // Generate verification token
    generateVerificationToken() {
        return uuidv4();
    }

    // Send verification email
    async sendVerificationEmail(userEmail, userName, verificationToken) {
        const verificationUrl = `${config.frontendUrl}/verify-email?token=${verificationToken}`;
        
        const mailOptions = {
            from: config.emailUser,
            to: userEmail,
            subject: 'Verify Your School Gossip Forum Account',
            html: `
                <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                        <h1 style="color: white; margin: 0;">School Gossip Forum</h1>
                        <p style="color: white; margin: 10px 0 0 0;">Email Verification Required</p>
                    </div>
                    
                    <div style="padding: 30px; background: #f8f9fa;">
                        <h2 style="color: #333; margin-bottom: 20px;">Hi ${userName}!</h2>
                        
                        <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
                            Thanks for joining our school community! To complete your registration and start posting, 
                            please verify your email address by clicking the button below.
                        </p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${verificationUrl}" 
                               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                      color: white; 
                                      text-decoration: none; 
                                      padding: 15px 30px; 
                                      border-radius: 25px; 
                                      display: inline-block; 
                                      font-weight: bold;">
                                Verify Email Address
                            </a>
                        </div>
                        
                        <p style="color: #666; font-size: 14px; line-height: 1.5;">
                            If the button doesn't work, copy and paste this link into your browser:<br>
                            <a href="${verificationUrl}" style="color: #667eea; word-break: break-all;">
                                ${verificationUrl}
                            </a>
                        </p>
                        
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                            <p style="color: #999; font-size: 12px; margin: 0;">
                                This verification link will expire in 24 hours. If you didn't create an account, 
                                please ignore this email.
                            </p>
                        </div>
                    </div>
                </div>
            `
        };

        try {
            await this.transporter.sendMail(mailOptions);
            return { success: true, message: 'Verification email sent successfully' };
        } catch (error) {
            console.error('Email sending error:', error);
            return { success: false, message: 'Failed to send verification email', error: error.message };
        }
    }

    // Send password reset email (for future use)
    async sendPasswordResetEmail(userEmail, userName, resetToken) {
        const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;
        
        const mailOptions = {
            from: config.emailUser,
            to: userEmail,
            subject: 'Reset Your School Gossip Forum Password',
            html: `
                <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                    <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 30px; text-align: center;">
                        <h1 style="color: white; margin: 0;">School Gossip Forum</h1>
                        <p style="color: white; margin: 10px 0 0 0;">Password Reset Request</p>
                    </div>
                    
                    <div style="padding: 30px; background: #f8f9fa;">
                        <h2 style="color: #333; margin-bottom: 20px;">Hi ${userName}!</h2>
                        
                        <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
                            We received a request to reset your password. Click the button below to create a new password.
                        </p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetUrl}" 
                               style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); 
                                      color: white; 
                                      text-decoration: none; 
                                      padding: 15px 30px; 
                                      border-radius: 25px; 
                                      display: inline-block; 
                                      font-weight: bold;">
                                Reset Password
                            </a>
                        </div>
                        
                        <p style="color: #666; font-size: 14px; line-height: 1.5;">
                            If the button doesn't work, copy and paste this link into your browser:<br>
                            <a href="${resetUrl}" style="color: #ff6b6b; word-break: break-all;">
                                ${resetUrl}
                            </a>
                        </p>
                        
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                            <p style="color: #999; font-size: 12px; margin: 0;">
                                This reset link will expire in 1 hour. If you didn't request a password reset, 
                                please ignore this email.
                            </p>
                        </div>
                    </div>
                </div>
            `
        };

        try {
            await this.transporter.sendMail(mailOptions);
            return { success: true, message: 'Password reset email sent successfully' };
        } catch (error) {
            console.error('Email sending error:', error);
            return { success: false, message: 'Failed to send password reset email', error: error.message };
        }
    }

    // Test email configuration
    async testConnection() {
        try {
            await this.transporter.verify();
            return { success: true, message: 'Email service is configured correctly' };
        } catch (error) {
            console.error('Email configuration error:', error);
            return { success: false, message: 'Email service configuration failed', error: error.message };
        }
    }
}

module.exports = new EmailService();
