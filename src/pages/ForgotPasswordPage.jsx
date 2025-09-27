import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Form, Button, Spinner } from 'react-bootstrap';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import '../assets/Auth.css';

// --- Icons for UI enhancement ---
const SuccessIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/></svg>;
const ErrorIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/></svg>;

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset link sent! Check your inbox.');
    } catch (err) {
      setError('Failed to send reset email. Please check the address and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="text-center mb-2 font-cormorant display-5">Reset Password</h2>
        <p className="text-center text-muted mb-4">No worries, we'll send you reset instructions.</p>
        
        {error && (
          <div className="auth-message error">
            <ErrorIcon /> {error}
          </div>
        )}
        {message && (
          <div className="auth-message success">
            <SuccessIcon /> {message}
          </div>
        )}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3 form-group-v2">
            <Form.Control
              type="email"
              placeholder=" "
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
            <Form.Label>Email Address</Form.Label>
          </Form.Group>
          
          <Button variant="primary" type="submit" className="w-100 btn-custom mt-3" disabled={loading}>
            {loading ? (
              <><Spinner as="span" animation="border" size="sm" /> Sending...</>
            ) : (
              'Send Reset Link'
            )}
          </Button>
        </Form>
        <div className="mt-4 text-center auth-switch-link">
          <Link to="/login">Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;