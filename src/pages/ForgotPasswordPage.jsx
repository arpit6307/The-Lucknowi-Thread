import React, { useState } from 'react';
import { Form, Button, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import '../assets/Auth.css';

// --- Icon ---
const ArrowLeftIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/></svg>);

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');
        try {
            await sendPasswordResetEmail(auth, email);
            setMessage('Password reset link sent! Please check your inbox (and spam folder).');
        } catch (err) {
            setError('Failed to send reset email. Please ensure the email address is correct.');
        }
        setLoading(false);
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="font-cormorant">Reset Password</h2>
                <p className="text-muted">Enter your email to receive a password reset link.</p>

                {error && <div className="auth-message error">{error}</div>}
                {message && <div className="auth-message success">{message}</div>}

                <Form onSubmit={handleSubmit}>
                    <div className="form-group-v2">
                        <input 
                            type="email" 
                            id="email" 
                            className="form-control" 
                            placeholder=" " 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            required 
                        />
                        <label htmlFor="email" className="form-label">Email Address</label>
                    </div>

                    <div className="d-grid mt-4">
                        <Button type="submit" className="btn-custom" disabled={loading}>
                            {loading ? <Spinner as="span" size="sm"/> : 'Send Reset Link'}
                        </Button>
                    </div>
                </Form>
                <div className="mt-4 text-center">
                    <Link to="/login" className="form-link d-flex align-items-center justify-content-center gap-2">
                        <ArrowLeftIcon /> Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;

