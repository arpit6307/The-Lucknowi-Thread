import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Button, Spinner } from 'react-bootstrap';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { setDoc, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import '../assets/Auth.css';

// --- Icons for UI enhancement ---
const GoogleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path d="M15.545 6.558a9.42 9.42 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.689 7.689 0 0 1 5.352 2.082l-2.284 2.284A4.347 4.347 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.792 4.792 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.702 3.702 0 0 0 1.599-2.431H8v-3.08h7.545z"/></svg>;
const ErrorIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/></svg>;

const SignupPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await setDoc(doc(db, "users", user.uid), {
        name: name,
        email: user.email,
        role: 'user'
      });
      navigate('/login');
    } catch (err) {
      if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters long.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email address is already in use.');
      } else {
        setError('Failed to create an account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    // ... (same as LoginPage)
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="text-center mb-2 font-cormorant display-5">Create an Account</h2>
        <p className="text-center text-muted mb-4">Join us to celebrate the art of Chikankari.</p>
        
        {error && <div className="auth-message error"><ErrorIcon /> {error}</div>}
        
        <Form onSubmit={handleSignup}>
          <Form.Group className="mb-4 form-group-v2">
            <Form.Control type="text" placeholder=" " value={name} onChange={(e) => setName(e.target.value)} required />
            <Form.Label>Full Name</Form.Label>
          </Form.Group>
          <Form.Group className="mb-4 form-group-v2">
            <Form.Control type="email" placeholder=" " value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Form.Label>Email Address</Form.Label>
          </Form.Group>
          <Form.Group className="mb-4 form-group-v2">
            <Form.Control type="password" placeholder=" " value={password} onChange={(e) => setPassword(e.target.value)} required />
            <Form.Label>Password</Form.Label>
          </Form.Group>
          <Form.Group className="mb-4 form-group-v2">
            <Form.Control type="password" placeholder=" " value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            <Form.Label>Confirm Password</Form.Label>
          </Form.Group>

          <Button variant="primary" type="submit" className="w-100 btn-custom" disabled={loading}>
            {loading ? <><Spinner as="span" animation="border" size="sm"/> Creating Account...</> : 'Create Account'}
          </Button>
        </Form>
        
        <div className="divider">OR</div>
        
        <Button variant="light" className="w-100 btn-social" onClick={handleGoogleLogin}>
          <GoogleIcon /> <span className="ms-2">Continue with Google</span>
        </Button>
        
        <div className="mt-4 text-center auth-switch-link">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;