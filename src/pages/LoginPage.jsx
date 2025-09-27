import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Button, InputGroup, Modal, Spinner } from 'react-bootstrap';
import { signInWithEmailAndPassword, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import '../assets/Auth.css';

// --- Icons for UI enhancement ---
const EmailIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414.05 3.555zM0 4.697v7.104l5.803-3.558L0 4.697zM6.761 8.83l-6.57 4.027A2 2 0 0 0 2 14h12a2 2 0 0 0 1.808-1.144l-6.57-4.027L8 9.586l-1.239-.757zm3.436-.586L16 11.801V4.697l-5.803 3.546z"/></svg>;
const PasswordIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/></svg>;
const GoogleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path d="M15.545 6.558a9.42 9.42 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.689 7.689 0 0 1 5.352 2.082l-2.284 2.284A4.347 4.347 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.792 4.792 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.702 3.702 0 0 0 1.599-2.431H8v-3.08h7.545z"/></svg>;
const ErrorIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/></svg>;


const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState({ text: '', type: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err) {
      setError('Failed to log in. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    setError('');
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          name: user.displayName,
          email: user.email,
          role: 'user'
        });
      }
      navigate('/');
    } catch (err) {
      setError('Failed to log in with Google. Please try again.');
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setResetMessage({ text: '', type: '' });
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMessage({ text: 'Password reset link sent! Check your inbox.', type: 'success' });
    } catch (err) {
      setResetMessage({ text: 'Failed to send email. Please check the address.', type: 'danger' });
    }
  };

  return (
    <>
      <div className="auth-container">
        <div className="auth-card">
          <h2 className="text-center mb-2 font-cormorant display-5">Welcome Back</h2>
          <p className="text-center text-muted mb-4">Log in to continue your shopping journey.</p>
          
          {error && <div className="auth-message error"><ErrorIcon /> {error}</div>}
          
          <Form onSubmit={handleLogin}>
            <Form.Group className="mb-4 form-group-v2">
              <Form.Control type="email" placeholder=" " value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Form.Label>Email Address</Form.Label>
            </Form.Group>

            <Form.Group className="mb-2 form-group-v2">
              <Form.Control type={showPassword ? 'text' : 'password'} placeholder=" " value={password} onChange={(e) => setPassword(e.target.value)} required />
              <Form.Label>Password</Form.Label>
            </Form.Group>

            <div className="text-end mb-3"><Link to="#" onClick={() => setShowForgotModal(true)} className="form-link">Forgot Password?</Link></div>
            
            <Button variant="primary" type="submit" className="w-100 btn-custom" disabled={loading}>
              {loading ? <><Spinner as="span" animation="border" size="sm" /> Logging In...</> : 'Login'}
            </Button>
            
            <div className="divider">OR</div>
            
            <Button variant="light" className="w-100 btn-social" onClick={handleGoogleLogin}>
              <GoogleIcon /> <span className="ms-2">Continue with Google</span>
            </Button>
          </Form>
          
          <div className="mt-4 text-center auth-switch-link">
            Don't have an account? <Link to="/signup">Sign Up</Link>
          </div>
        </div>
      </div>

      <Modal show={showForgotModal} onHide={() => setShowForgotModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="font-cormorant">Reset Your Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {resetMessage.text && <div className={`auth-message ${resetMessage.type}`}>{resetMessage.text}</div>}
          <p>Enter your email address and we will send you a link to reset your password.</p>
          <Form onSubmit={handlePasswordReset}>
            <Form.Group>
                <Form.Label>Email Address</Form.Label>
                <Form.Control type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="Enter your email" required />
            </Form.Group>
            <Button type="submit" className="w-100 btn-custom mt-3">Send Reset Link</Button>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default LoginPage;