import React, { useState } from 'react';
import { Form, Button, Spinner, InputGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { countryCodes } from '../components/countryCodes';
import '../assets/Auth.css';

// --- Icons ---
const EyeIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/><path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/></svg>);
const EyeSlashIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.94 5.94 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z"/><path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.288.822.822.084.083a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z"/><path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 6.884-12-12 .708-.708 12 12-.708.708z"/></svg>);


const SignupPage = ({ setUserRole }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [countryCode, setCountryCode] = useState('+91');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) { return setError("Passwords do not match"); }
        setLoading(true); setError('');
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await setDoc(doc(db, "users", userCredential.user.uid), {
                name, email, phone, countryCode, role: 'customer', createdAt: serverTimestamp(),
            });
            setUserRole('customer'); localStorage.setItem('userRole', 'customer');
            navigate('/');
        } catch (err) {
            setError(err.code === 'auth/email-already-in-use' ? 'This email is already registered.' : 'Failed to create an account.');
        }
        setLoading(false);
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="font-cormorant">Create an Account</h2>
                <p className="text-muted">Join our legacy of craftsmanship.</p>

                {error && <div className="auth-message error">{error}</div>}

                <Form onSubmit={handleSignup}>
                    <div className="form-group-v2"><input type="text" id="name" className="form-control" placeholder=" " value={name} onChange={(e) => setName(e.target.value)} required /><label htmlFor="name" className="form-label">Full Name</label></div>
                    <div className="form-group-v2"><input type="email" id="email" className="form-control" placeholder=" " value={email} onChange={(e) => setEmail(e.target.value)} required /><label htmlFor="email" className="form-label">Email Address</label></div>
                    <InputGroup className="mb-3"><Form.Select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} style={{ flex: '0 0 100px' }}>{countryCodes.map(c => <option key={c.name} value={c.code}>{c.code}</option>)}</Form.Select><div className="form-group-v2 flex-grow-1 m-0"><input type="tel" id="phone" className="form-control" placeholder=" " value={phone} onChange={(e) => setPhone(e.target.value)} required pattern="\d{10,}" /><label htmlFor="phone" className="form-label">Mobile Number</label></div></InputGroup>

                    <div className="form-group-v2"><div className="password-input-wrapper"><input type={showPassword ? "text" : "password"} id="password" className="form-control" placeholder=" " value={password} onChange={(e) => setPassword(e.target.value)} required /><label htmlFor="password" className="form-label">Password</label><button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeSlashIcon /> : <EyeIcon />}</button></div></div>
                    <div className="form-group-v2"><div className="password-input-wrapper"><input type={showConfirmPassword ? "text" : "password"} id="confirmPassword" className="form-control" placeholder=" " value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required /><label htmlFor="confirmPassword" className="form-label">Confirm Password</label><button type="button" className="password-toggle-btn" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? <EyeSlashIcon /> : <EyeIcon />}</button></div></div>

                    <div className="d-grid gap-3 mt-4">
                        <Button type="submit" className="btn-custom" disabled={loading}>{loading ? <Spinner as="span" size="sm"/> : 'Sign Up'}</Button>
                    </div>
                </Form>
                <div className="mt-4 text-center auth-switch-link">
                    <span>Already have an account? </span><Link to="/login">Log In</Link>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;

